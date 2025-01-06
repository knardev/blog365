import { createClient } from "@supabase/supabase-js";
import { fetchSerpResults, QueueMessage, saveSerpResults } from "./actions";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

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

const MESSAGE_LIMIT = 5; // 테스트 목적: 1개씩 처리

// ★ 추가: 오늘 날짜에 이미 존재하는지 체크하는 함수
async function serpResultExists(keywordId: string): Promise<boolean> {
  // const today = getYesterdayInKST(); // 오늘 날짜는 KST 기준으로 어제
  const today = getTodayInKST(); // 오늘 날짜는 KST 기준으로 어제
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("serp_results")
    .select("*")
    .eq("keyword_id", keywordId)
    .eq("date", today)
    .single();

  // PGRST116 → row not found
  if (error && error.code !== "PGRST116") {
    console.error("Error checking existing SERP result:", error);
    // 에러면 일단 false 리턴(존재하지 않는다고 가정) or throw
  }

  return !!data; // data 있으면 true
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  await delay(500); // 1초 대기

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

  console.log(`[INFO] Processing ${messages.length} messages in parallel...`);

  // 3) 병렬로 메시지 처리
  await Promise.all(
    messages.map(async (message: QueueMessage) => {
      const { id: keywordId, name: keyword } = message.message;

      try {
        // ★ 먼저 DB에 이미 존재하는지 확인
        const alreadyExists = await serpResultExists(keywordId);
        if (alreadyExists) {
          console.log(
            `[SKIP] SERP result already exists for keywordId="${keywordId}". Skipping scraping.`,
          );

          // 메시지 아카이브
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
          return;
        }

        console.log(`[ACTION] Processing SERP results for keyword: ${keyword}`);

        // DB에 없으면 새로 스크래핑
        const serpData = await fetchSerpResults(keyword);
        if (!serpData) {
          console.warn(`[WARN] No SERP data returned for keyword: ${keyword}`);

          // 그래도 메시지는 소비했으니 아카이브
          // const { error: archiveError } = await queues.rpc("archive", {
          //   queue_name: "serp_scrapping",
          //   message_id: message.msg_id,
          // });

          // if (archiveError) {
          //   console.error(
          //     `[ERROR] Failed to archive message with id "${message.msg_id}":`,
          //     archiveError,
          //   );
          // }
          return;
        }

        // 결과 저장
        const saveResult = await saveSerpResults(keywordId, serpData);
        if (!saveResult.success) {
          console.error(
            `[ERROR] Failed to save SERP data for keyword "${keyword}":`,
            saveResult.error,
          );
          // 그래도 메시지는 아카이브
          const { error: archiveError } = await queues.rpc("archive", {
            queue_name: "serp_scrapping",
            message_id: message.msg_id,
          });

          if (archiveError) {
            console.error(
              `[ERROR] Failed to archive message with id "${message.msg_id}":`,
              archiveError,
            );
          }
          return;
        }

        console.log(`[SUCCESS] SERP data saved for keyword: ${keyword}`);

        // 메시지 아카이브
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
      } catch (err) {
        console.error(`[ERROR] Failed to process message: ${err}`);
      }
    }),
  );

  console.log("[INFO] Current batch of messages processed.");

  // 4) 큐에 메시지가 남았는지 체크
  const { data: nextCheck, error: nextCheckError } = await queues.rpc("read", {
    queue_name: "serp_scrapping",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextCheckError) {
    console.warn("[WARN] Checking next messages failed:", nextCheckError);
  } else if (nextCheck && nextCheck.length > 0) {
    // 메시지가 또 있다면 self-invoke
    console.log("[INFO] More messages remain. Invoking self again...");

    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/process-webhook`, {
      method: "POST",
      headers: {
        "X-Secret-Key": incomingKey || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "scrapping-serp-results",
        payload: {},
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

  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed. Batch done.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
