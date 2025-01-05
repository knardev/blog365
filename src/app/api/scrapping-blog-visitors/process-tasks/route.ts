import { createClient } from "@supabase/supabase-js";
import { processBlogVisitorData } from "./actions";

// export const runtime = "edge"; // Next.js Edge Runtime
export const maxDuration = 3;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

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
  // 간단한 인증 로직 (원한다면): 헤더 검사
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  const incomingKey = request.headers.get("X-Secret-Key");
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

  // 1) 큐에서 메시지 가져오기
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "blog_scrapping",
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

  // 2) 메시지가 없으면 종료
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

  // 3) 각 메시지 처리
  for (const message of messages) {
    const blog_slug = message.message.blog_slug;
    console.log(`[INFO] Processing message with blog_slug "${blog_slug}"...`);

    const result = await processBlogVisitorData(supabase, blog_slug);

    if (!result.success) {
      console.error(
        `[ERROR] Failed to process message with blog_slug "${blog_slug}": ${result.error}`,
      );
      // 메시지 처리 실패했지만, 계속 진행(또는 로직에 따라 중단 가능)
      continue;
    }

    console.log(
      `[SUCCESS] Message with blog_slug "${blog_slug}" processed successfully.`,
    );

    // 처리 완료 후 메시지 아카이브
    const { error: archiveError } = await queues.rpc("archive", {
      queue_name: "blog_scrapping",
      message_id: message.msg_id,
    });

    if (archiveError) {
      console.error(
        `[ERROR] Failed to archive message with id "${message.msg_id}":`,
        archiveError,
      );
    } else {
      console.log(
        `[INFO] Message with id "${message.msg_id}" archived from the queue.`,
      );
    }
  }

  // 여기까지 현재 batch(최대 50건) 처리 완료
  console.log("[ROUTE] Current batch of messages completed.");

  // 4) 추가 메시지 유무 확인 → 남아 있으면 self-invoke
  try {
    const { data: leftoverMessages, error: leftoverError } = await queues.rpc(
      "read",
      {
        queue_name: "blog_scrapping",
        sleep_seconds: 0,
        n: 1, // 1개만 미리 확인
      },
    );

    // leftoverCheck 후, 다시 넣어주기(rollback) 위해선 archive 대신 "requeue" 개념이 필요할 수 있음
    // 여기서는 그냥 "메시지가 있나?" 확인만 진행
    if (leftoverError) {
      console.warn("[WARN] Checking leftover messages failed:", leftoverError);
    } else if (leftoverMessages && leftoverMessages.length > 0) {
      console.log("[INFO] More messages remain in the queue. Self-invoking...");

      // 새 요청을 GET으로 호출(현재 route URL)
      // X-Secret-Key 헤더를 다시 전달
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
      console.log("[INFO] No more messages left in the queue.");
    }
  } catch (err) {
    console.error("[ERROR] Self-invocation check failed:", err);
  }

  // 5) 클라이언트(혹은 Cron 등)에는 일단 "정상 처리 완료" 응답
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
