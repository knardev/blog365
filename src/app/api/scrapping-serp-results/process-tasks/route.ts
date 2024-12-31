import { createClient } from "@supabase/supabase-js";
import { fetchSerpResults, saveSerpResults } from "./actions";

// export const runtime = "edge";
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

const MESSAGE_LIMIT = 1; // 테스트 목적: 1개씩 처리

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

  // 2) 큐에서 메시지 가져오기
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "serp_scrapping",
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

  // 3) 메시지가 없는 경우 → 즉시 종료
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

  // 4) 메시지 처리
  for (const message of messages) {
    const { id: keywordId, name: keyword } = message.message;

    console.log(`[ACTION] Processing SERP results for keyword: ${keyword}`);

    const serpData = await fetchSerpResults(keyword);

    if (!serpData) {
      console.warn(`[WARN] No SERP data returned for keyword: ${keyword}`);
      continue;
    }

    const saveResult = await saveSerpResults(keywordId, serpData);

    if (!saveResult.success) {
      console.error(
        `[ERROR] Failed to save SERP data for keyword "${keyword}":`,
        saveResult.error,
      );
      continue;
    }

    console.log(`[SUCCESS] SERP data saved for keyword: ${keyword}`);

    // 5) 처리 완료 후 메시지 아카이브
    const { error: archiveError } = await queues.rpc("archive", {
      queue_name: "serp_scrapping",
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

  // 6) "큐에 아직 메시지가 남아 있는지" 체크
  //    - pgmq 라이브러리/함수마다 다르지만, 예시로 messages_count() 같은 함수를 사용하거나,
  //      다시 read(n=1, sleep_seconds=0)로 테스트만 해볼 수도 있습니다.
  //    - 여기서는 단순히 read 한 번 더 시도해 보고, 있으면 self-invoke하는 예시입니다.
  const { data: nextCheck, error: nextCheckError } = await queues.rpc("read", {
    queue_name: "serp_scrapping",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextCheckError) {
    console.warn("[WARN] Checking next messages failed:", nextCheckError);
    // 에러 시에는 그냥 종료
  } else if (nextCheck && nextCheck.length > 0) {
    // 메시지가 또 있다면 → self invoke
    console.log("[INFO] More messages remain. Invoking self again...");

    // self-invocation: 같은 URL(현재 request.url)을 GET으로 호출
    // X-Secret-Key 인증 헤더 포함
    // (주의: 여기서 await로 대기하면 현재 함수가 끝나기 전에 응답 시간이 길어질 수 있으므로,
    //  필요에 따라 await를 붙이지 않고 백그라운드로 날릴 수도 있습니다.)
    // 공통 웹훅 엔드포인트 호출 (비동기)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/process-webhook`, {
      method: "POST",
      headers: {
        "X-Secret-Key": incomingKey || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "scrapping-serp-results",
        payload: {}, // 필요 시 추가 데이터 포함
      }),
    })
      .then(() => {
        console.log("[INFO] Webhook invocation triggered successfully.");
      })
      .catch((err) => {
        console.error("[ERROR] Failed to invoke webhook:", err);
      });
  } else {
    console.log("[INFO] No more messages left in the queue.");
  }

  // 7) 최종 응답
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed. Batch done.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
