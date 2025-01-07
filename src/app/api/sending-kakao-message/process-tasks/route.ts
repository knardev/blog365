import { createClient } from "@supabase/supabase-js";
import { QueueMessage, sendKakaoMessageAction } from "./actions";

// export const runtime = "edge"; // (원한다면 사용)
export const maxDuration = 5;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// pgmq + Supabase client
const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// 한 번에 처리할 메시지 수
const MESSAGE_LIMIT = 10;

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

  console.log("[INFO] Fetching messages from 'sending_kakao_message' queue...");

  // 2) 큐에서 메시지 가져오기
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "send_kakao_message",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to read from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to read from queue." }),
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
    messages.map(async (msg: QueueMessage) => {
      const { project_id, phone_number } = msg.message;

      try {
        console.log(
          `[ACTION] Sending Kakao message for project_id=${project_id}, phone=${phone_number}`,
        );

        // 실제 처리: Solapi API를 사용해 메시지를 보내는 action
        const actionResult = await sendKakaoMessageAction(
          project_id,
          phone_number,
        );

        if (!actionResult.success) {
          console.error(
            "[ERROR] Failed to send Kakao message:",
            actionResult.error,
          );
          return;
        }

        console.log(
          `[SUCCESS] Kakao message sent for project_id=${project_id}, phone=${phone_number}`,
        );

        // 4) 메시지 아카이브 (처리 완료 시 큐에서 제거)
        const { error: archiveError } = await queues.rpc("archive", {
          queue_name: "send_kakao_message",
          message_id: msg.msg_id,
        });

        if (archiveError) {
          console.error("[ERROR] Failed to archive message:", archiveError);
        } else {
          console.log(`[INFO] Archived message id=${msg.msg_id}`);
        }
      } catch (err) {
        console.error(`[ERROR] Failed to process message: ${err}`);
      }
    }),
  );

  console.log("[INFO] Current batch of messages processed.");

  // 4) 큐에 메시지가 남았는지 확인
  const { data: nextCheck, error: nextCheckError } = await queues.rpc("read", {
    queue_name: "send_kakao_message",
    sleep_seconds: 0,
    n: 1,
  });

  if (nextCheckError) {
    console.warn("[WARN] Failed to check next messages:", nextCheckError);
  } else if (nextCheck && nextCheck.length > 0) {
    // 메시지가 남아 있으면 self-invoke
    console.log("[INFO] More messages remain. Invoking self again...");

    // self-invocation (비동기로 처리)
    fetch(request.url, {
      method: "GET",
      headers: { "X-Secret-Key": incomingKey ?? "" },
    })
      .then(() => {
        console.log("[INFO] Self invocation triggered.");
      })
      .catch((err) => {
        console.error("[ERROR] Failed to self-invoke:", err);
      });
  } else {
    console.log("[INFO] No more messages in the queue.");
  }

  // 5) 응답
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
