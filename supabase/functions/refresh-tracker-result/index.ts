import { createClient } from "@supabase"; // Deno-compatible Supabase client

/**
 * 간단한 delay 함수
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 한 번에 처리할 동시 요청 수 */
const CONCURRENCY_LIMIT = 5;
/** 한 번에 큐에서 가져올 메시지 수 */
const MESSAGE_LIMIT = 20;

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
 * - 각 메시지마다 /api/scrap-single-tracker-result로 POST 요청을 보냄
 * - POST body는 메시지 큐 데이터와 동일한 구조를 사용함
 * - 요청 성공 시, refresh 트랜잭션 카운트를 1 차감하는 RPC를 호출함
 */
async function processMessages(
  messages: Array<{
    msg_id: number;
    message: {
      projectId: string;
      trackerId: string;
      keywordId: string;
      keywordName: string;
      refreshTransaction: string;
    };
  }>,
  baseUrl: string,
) {
  let currentIndex = 0;
  let inFlight = 0;
  const total = messages.length;

  while (currentIndex < total || inFlight > 0) {
    while (inFlight < CONCURRENCY_LIMIT && currentIndex < total) {
      const msg = messages[currentIndex++];
      inFlight++;

      // POST 요청 시, 메시지 큐에 담긴 필드 그대로 전달
      fetch(`${baseUrl}/api/scrap-single-tracker-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          projectId: msg.message.projectId,
          trackerId: msg.message.trackerId,
          keywordId: msg.message.keywordId,
          keywordName: msg.message.keywordName,
          refreshTransaction: msg.message.refreshTransaction,
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
          // 메시지 아카이브: supabase 클라이언트를 사용하여 refresh_tracker_result 큐에서 해당 메시지를 아카이브 처리
          const { error: archiveErr } = await queues.rpc("archive", {
            queue_name: "refresh_tracker_result",
            message_id: msg.msg_id,
          });
          if (archiveErr) {
            console.error(
              `[ERROR] Failed to archive msg_id=${msg.msg_id}:`,
              archiveErr,
            );
          } else {
            console.log(
              `[INFO] Archived msg_id=${msg.msg_id} successfully.`,
            );
          }

          // 요청이 정상 처리되면, tracker_result_refresh_transactions 테이블의 current_count를 원자적으로 1 증가시키는 RPC 호출
          const { error: incErr, data: updatedData } = await supabase.rpc(
            "increment_refresh_transaction",
            {
              transaction_id: msg.message.refreshTransaction,
              increment_by: 1,
            },
          );
          if (incErr) {
            console.error(
              `[ERROR] Failed to atomically increment transaction for msg_id=${msg.msg_id}:`,
              incErr,
            );
          } else {
            console.log(
              `[INFO] Atomically incremented transaction for msg_id=${msg.msg_id}. New current_count: ${
                updatedData?.[0]?.current_count
              }`,
            );
          }
        })
        .catch((err) => {
          console.error(
            `[ERROR] fetch crashed (msg_id=${msg.msg_id}):`,
            err,
          );
        })
        .finally(() => {
          inFlight--;
        });
    }

    if (currentIndex < total || inFlight > 0) {
      await delay(300);
    }
  }
}

/**
 * 메인 핸들러
 * - 인증 후 background task로 refresh 처리 실행
 * - "refresh_tracker_result" 큐에서 메시지를 읽어와서 처리
 */
Deno.serve((req: Request) => {
  try {
    const incomingKey = req.headers.get("X-Secret-Key") ?? "";
    if (
      !SUPABASE_SERVICE_ROLE_KEY ||
      incomingKey !== SUPABASE_SERVICE_ROLE_KEY
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    EdgeRuntime.waitUntil(
      (async () => {
        console.log(
          "[INFO] Starting refresh tracker result background task...",
        );

        const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
        if (!baseUrl) {
          console.error("[ERROR] NEXT_BASE_URL not configured.");
          return;
        }

        while (true) {
          const { data: messages, error: queueError } = await queues.rpc(
            "read",
            {
              queue_name: "refresh_tracker_result",
              sleep_seconds: 60,
              n: MESSAGE_LIMIT,
            },
          );

          if (queueError) {
            console.error("[ERROR] Failed to read from queue:", queueError);
            break;
          }

          if (!messages || messages.length === 0) {
            console.log(
              "[INFO] No more refresh messages. Stopping queue-processing.",
            );
            break;
          }

          console.log(
            `[INFO] Fetched ${messages.length} refresh messages. Processing...`,
          );

          await processMessages(messages, baseUrl);
        }

        console.log(
          "[INFO] Refresh tracker result background task completed.",
        );
      })(),
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Refresh processing started (concurrency=${CONCURRENCY_LIMIT}, batch=${MESSAGE_LIMIT}).`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start refresh processing:", err);
    const errorMessage = err instanceof Error
      ? err.message
      : "Unknown error occurred.";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
