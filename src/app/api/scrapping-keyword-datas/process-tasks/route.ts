import { createClient } from "@supabase/supabase-js";
import {
  processKeywordData,
  QueueMessage,
  saveKeywordAnalytics,
} from "./actions";

export const maxDuration = 3;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const MESSAGE_LIMIT = 3; // 한 번에 가져올 메시지 수

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  await delay(1000); // 1초 대기
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 1) 큐에서 메시지 10개 가져오기
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "keyword_data_scrapping",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to fetch messages from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch messages" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!messages || messages.length === 0) {
    console.log("[INFO] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[INFO] Fetched ${messages.length} messages from the queue.`);

  // 2) 병렬 처리
  await Promise.all(
    messages.map(async (message: QueueMessage) => {
      const keyword = message.message.name;
      console.log(`[ACTION] Processing keyword: ${keyword}`);

      // 실제 데이터 처리
      const keywordData = await processKeywordData(keyword);
      if (!keywordData) {
        console.warn(`[WARN] No data returned for keyword: ${keyword}`);
        return;
      }

      // 결과 저장
      const saveResult = await saveKeywordAnalytics(keyword, keywordData);
      if (!saveResult.success) {
        console.error(
          `[ERROR] Failed to save analytics data for keyword "${keyword}":`,
          saveResult.error,
        );
        return;
      }

      console.log(`[SUCCESS] Analytics data saved for keyword: ${keyword}`);

      // 메시지 아카이브
      const { error: archiveError } = await queues.rpc("archive", {
        queue_name: "keyword_data_scrapping",
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
    }),
  );

  console.log("[INFO] Current batch of messages processed.");

  // 3) 처리 후, 큐에 메시지가 남아있는지 다시 확인
  const { data: nextCheck, error: nextError } = await queues.rpc("read", {
    queue_name: "keyword_data_scrapping",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextError) {
    console.warn("[WARN] Error checking for remaining messages:", nextError);
  } else if (nextCheck && nextCheck.length > 0) {
    console.log("[INFO] More messages remain. Invoking self again...");

    fetch(request.url, {
      method: "GET",
      headers: {
        "X-Secret-Key": incomingKey ?? "",
      },
    })
      .then(() => console.log("[INFO] Self-invocation triggered."))
      .catch((err) =>
        console.error("[ERROR] Failed to self-invoke the function:", err)
      );
  } else {
    console.log("[INFO] No more messages left in the queue.");
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed (batch done).",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
