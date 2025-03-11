import { createClient } from "@supabase"; // Deno-compatible Supabase client

/**
 * 간단한 delay 함수
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 한 번에 처리할 동시 요청 수 */
const CONCURRENCY_LIMIT = 20;
/** 한 번에 큐에서 가져올 메시지 수 */
const MESSAGE_LIMIT = 100;

/** Supabase 환경변수 설정 */
const SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  throw new Error("Supabase URL or Service Role Key is not configured.");
}

/** 일반 public용 (데이터 조회 등) */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/** 메시지 큐 전용 pgmq client (schema: pgmq_public) */
const queues = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * 큐에서 가져온 메시지를 concurrency 제한으로 병렬 처리
 * - 메시지 처리 시 /api/sending-kakao-message로 POST 요청을 보냄
 * - 처리 성공 시 pgmq에서 아카이브
 */
async function processMessages(
  messages: Array<{
    msg_id: number;
    message: {
      project_id: string;
      phone_number: string;
    };
  }>,
  baseUrl: string,
) {
  let currentIndex = 0; // 현재 처리할 메시지 인덱스
  let inFlight = 0; // 현재 진행 중인(미완료) 작업 수
  const total = messages.length;

  while (currentIndex < total || inFlight > 0) {
    // 1) 여유 capacity가 있고, 처리하지 않은 메시지가 남았다면 새로운 처리를 시작
    while (inFlight < CONCURRENCY_LIMIT && currentIndex < total) {
      const msg = messages[currentIndex++];
      inFlight++;

      // ↓↓↓ 기존 sendKakaoMessageAction 함수를 대신해서 직접 fetch 호출 ↓↓↓
      fetch(`${baseUrl}/api/sending-kakao-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          project_id: msg.message.project_id,
          phone_number: msg.message.phone_number,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            console.error(
              `[ERROR] POST failed (msg_id=${msg.msg_id}):`,
              await res.text(),
            );
            return;
          }
          // 정상 응답이면 큐에서 아카이브
          const { error: archiveErr } = await queues.rpc("archive", {
            queue_name: "send_kakao_message",
            message_id: msg.msg_id,
          });
          if (archiveErr) {
            console.error(
              `[ERROR] Failed to archive msg_id=${msg.msg_id}:`,
              archiveErr,
            );
          } else {
            console.log(`[INFO] Archived msg_id=${msg.msg_id} successfully.`);
          }
        })
        .catch((err) => {
          console.error(`[ERROR] fetch crashed (msg_id=${msg.msg_id}):`, err);
        })
        .finally(() => {
          // 작업 1건 완료
          inFlight--;
        });
    }

    // 2) 아직 처리할 메시지가 남았거나(inFlight < total), 진행 중인 작업이 있으면(inFlight > 0) 대기
    if (currentIndex < total || inFlight > 0) {
      await delay(300); // 0.3초 등 원하는 만큼 딜레이
    }
  }
}

/**
 * 메인 핸들러
 * - 인증 체크
 * - waitUntil로 백그라운드 작업 수행
 * - "send_kakao_message" 큐를 계속 read하여 메시지가 없을 때까지 처리
 */
Deno.serve((req: Request) => {
  try {
    // 1) Authentication
    const incomingKey = req.headers.get("X-Secret-Key") ?? "";
    if (
      !SUPABASE_SERVICE_ROLE_KEY || incomingKey !== SUPABASE_SERVICE_ROLE_KEY
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2) Background task
    EdgeRuntime.waitUntil(
      (async () => {
        console.log("[INFO] Starting queue-processing background task...");

        // baseUrl 설정 (예: NEXT_BASE_URL 환경변수)
        const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
        if (!baseUrl) {
          console.error("[ERROR] NEXT_BASE_URL not configured.");
          return;
        }

        while (true) {
          // (A) 큐에서 메시지를 읽는다
          const { data: messages, error: queueError } = await queues.rpc(
            "read",
            {
              queue_name: "send_kakao_message",
              sleep_seconds: 60, // 즉시 반환
              n: MESSAGE_LIMIT,
            },
          );

          if (queueError) {
            console.error("[ERROR] Failed to read from queue:", queueError);
            break; // 에러 시 루프 중단 (혹은 재시도 로직)
          }

          if (!messages || messages.length === 0) {
            console.log("[INFO] No more messages. Stopping queue-processing.");
            break; // 메시지가 없으면 종료
          }

          console.log(
            `[INFO] Fetched ${messages.length} messages. Processing...`,
          );

          // (B) 읽어온 메시지 처리 (동시성 제한)
          await processMessages(messages, baseUrl);

          // (C) 다음 batch
        }

        console.log("[INFO] Queue-processing background task completed.");
      })(),
    );

    // 응답은 즉시 반환
    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Queue-processing started (concurrency=${CONCURRENCY_LIMIT}, batch=${MESSAGE_LIMIT}).`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start queue-processing:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
