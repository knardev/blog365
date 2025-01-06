import { processKeywordTrackerResult, QueueMessage } from "./actions";
import { createClient } from "@supabase/supabase-js";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

export const maxDuration = 3;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

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

const MESSAGE_LIMIT = 100;

/**
 * 오늘 날짜 데이터가 이미 존재하는지 확인하는 함수
 * @param trackerId - Keyword Tracker ID
 * @returns {Promise<boolean>} 이미 존재하면 true, 없으면 false
 */
async function trackerResultExists(trackerId: string): Promise<boolean> {
  // const today = getYesterdayInKST();
  const today = getTodayInKST();

  const { data, error } = await supabase
    .from("keyword_tracker_results")
    .select("*")
    .eq("keyword_tracker", trackerId)
    .eq("date", today)
    .single(); // single()을 사용하여 한 개의 결과만 가져옴

  if (error && error.code !== "PGRST116") {
    console.error("[INFO] There are no existing data");
    return false;
  }

  // data가 있으면 true, 없으면 false 반환
  return !!data;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  await delay(500); // 1초 대기

  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

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

  // 큐에서 메시지 가져오기
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

  console.log(`[INFO] Processing ${messages.length} messages in parallel...`);

  // 병렬로 메시지 처리
  const results = await Promise.all(
    messages.map(async (message: QueueMessage) => {
      const { tracker_id: trackerId } = message.message;

      try {
        // 오늘 데이터가 이미 존재하는지 확인
        const alreadyExists = await trackerResultExists(trackerId);
        if (alreadyExists) {
          console.log(
            `[SKIP] Tracker result already exists for tracker_id="${trackerId}". Skipping...`,
          );

          // 메시지 아카이브
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
            console.log(`[INFO] Message archived with id: ${message.msg_id}`);
          }

          return { success: true };
        }

        console.log(
          `[ACTION] Processing tracker result for tracker_id: ${trackerId}`,
        );

        // 처리 로직 실행
        const result = await processKeywordTrackerResult(message.message);

        if (!result.success) {
          console.error(
            `[ERROR] Failed to process tracker result for tracker_id="${trackerId}":`,
            result.error,
          );
          return { success: false, error: result.error };
        }

        console.log(
          `[SUCCESS] Tracker result processed for tracker_id: ${trackerId}`,
        );

        // 메시지 아카이브
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
          console.log(`[INFO] Message archived with id: ${message.msg_id}`);
        }

        return { success: true };
      } catch (err) {
        console.error(
          `[ERROR] Failed to process message for tracker_id="${trackerId}":`,
          err,
        );
        return { success: false, error: err };
      }
    }),
  );

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  console.log(
    `[INFO] Successfully processed ${successCount} messages. Failed to process ${failureCount} messages.`,
  );

  // 큐에 메시지가 남았는지 체크
  const { data: nextCheck, error: nextCheckError } = await queues.rpc("read", {
    queue_name: "blog_ranks_scrapping",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextCheckError) {
    console.warn("[WARN] Checking next messages failed:", nextCheckError);
  } else if (nextCheck && nextCheck.length > 0) {
    console.log(
      "[INFO] More messages remain in the queue. Triggering self-invocation...",
    );

    fetch(request.url, {
      method: "GET",
      headers: {
        "X-Secret-Key": incomingKey ?? "",
      },
    })
      .then(() => console.log("[INFO] Self invocation triggered successfully."))
      .catch((err) => console.error("[ERROR] Failed to self-invoke:", err));
  } else {
    console.log("[INFO] No more messages left in the queue after this batch.");
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: successCount,
      failed: failureCount,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
