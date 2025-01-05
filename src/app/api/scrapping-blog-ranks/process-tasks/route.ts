import { Message, processKeywordTrackerResult } from "./actions";
import { createClient } from "@supabase/supabase-js";

// export const runtime = "edge"; // (원한다면 사용)
export const maxDuration = 3;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize Supabase client
const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const MESSAGE_LIMIT = 1;

export async function GET(request: Request) {
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  const incomingKey = request.headers.get("X-Secret-Key");

  // 1) 인증 체크
  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(
    `[ROUTE] Fetching up to ${MESSAGE_LIMIT} messages from the queue...`,
  );

  // 2) 메시지 읽기
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "blog_ranks_scrapping",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to fetch messages from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch messages" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 3) 메시지 없으면 종료
  if (!messages || messages.length === 0) {
    console.warn("[WARN] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(`[INFO] Retrieved ${messages.length} messages from the queue.`);

  let successCount = 0;

  // 4) 메시지 처리
  for (const message of messages) {
    const processedMessage: Message = {
      tracker_id: message.message.tracker_id,
      keyword_id: message.message.keyword_id,
      project_id: message.message.project_id,
      blog_id: message.message.blog_id,
    };

    // 실제 처리 로직
    const result = await processKeywordTrackerResult(processedMessage);

    if (result.success) {
      successCount++;

      // 처리 성공 → archive
      const { error: archiveError } = await queues.rpc("archive", {
        queue_name: "blog_ranks_scrapping",
        message_id: message.msg_id,
      });

      if (archiveError) {
        console.error(
          `[ERROR] Failed to archive message with id "${message.msg_id}":`,
          archiveError,
        );
      } else {
        console.log(`[INFO] Message with id "${message.msg_id}" archived.`);
      }
    } else {
      console.error(`[ERROR] Failed to process message:`, result.error);
    }
  }

  console.log(`[INFO] Successfully processed ${successCount} messages.`);

  // 5) 추가 메시지 확인 후 self-invoke
  try {
    const { data: nextCheck, error: nextCheckError } = await queues.rpc(
      "read",
      {
        queue_name: "blog_ranks_scrapping",
        sleep_seconds: 0,
        n: 1,
      },
    );

    if (nextCheckError) {
      console.warn("[WARN] Checking next messages failed:", nextCheckError);
    } else if (nextCheck && nextCheck.length > 0) {
      // 메시지가 남아있다면 self-invoke
      console.log(
        "[INFO] More messages remain in the queue. Triggering self-invocation...",
      );

      // 현재 라우트(URL)로 다시 GET 요청을 보냄
      // 헤더에 X-Secret-Key도 포함
      fetch(request.url, {
        method: "GET",
        headers: {
          "X-Secret-Key": incomingKey ?? "",
        },
      })
        .then(() => {
          console.log("[INFO] Self invocation triggered successfully.");
        })
        .catch((err) => {
          console.error("[ERROR] Failed to self-invoke:", err);
        });
    } else {
      console.log(
        "[INFO] No more messages left in the queue after this batch.",
      );
    }
  } catch (err) {
    console.error("[ERROR] Self-invocation check failed:", err);
  }

  // 6) 최종 응답
  return new Response(
    JSON.stringify({ success: true, processed: successCount }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
