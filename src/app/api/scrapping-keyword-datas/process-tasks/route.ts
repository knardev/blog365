import { createClient } from "@supabase/supabase-js";
import { processKeywordData, saveKeywordAnalytics } from "./actions";

// export const runtime = "edge";
// (Edge Runtime 사용 시 일부 Node.js API(fetch, Buffer 등) 제약이 있음.
//  self-invoke를 위해 fetch를 사용하므로 문제 없으면 주석 해제 고려)
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

const MESSAGE_LIMIT = 1;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  // 1) 인증 체크
  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2) 큐에서 메시지 3개까지 가져오기
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

  // 3) 메시지 처리
  for (const message of messages) {
    const keyword = message.message.name;
    console.log(`[ACTION] Processing keyword: ${keyword}`);

    // 예시 딜레이
    await delay(1000);

    // 실제 데이터 처리
    const keywordData = await processKeywordData(keyword);
    if (!keywordData) {
      console.warn(`[WARN] No data returned for keyword: ${keyword}`);
      continue;
    }

    // 결과 저장
    const saveResult = await saveKeywordAnalytics(keyword, keywordData);
    if (!saveResult.success) {
      console.error(
        `[ERROR] Failed to save analytics data for keyword "${keyword}":`,
        saveResult.error,
      );
      continue;
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
  }

  console.log("[INFO] Current batch of messages processed.");

  // 4) 처리 후, 큐에 메시지가 남아있는지 다시 확인
  //    - 마찬가지로, read(n=1)로 간단히 확인
  const { data: nextCheck, error: nextError } = await queues.rpc("read", {
    queue_name: "keyword_data_scrapping",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextError) {
    console.warn("[WARN] Error checking for remaining messages:", nextError);
    // 에러 났으면 그냥 종료
  } else if (nextCheck && nextCheck.length > 0) {
    // 메시지가 있으면 self-invoke
    console.log("[INFO] More messages remain. Invoking self again...");

    // self-invocation
    await fetch(request.url, {
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

  // 5) 최종 응답
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed (batch done).",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
