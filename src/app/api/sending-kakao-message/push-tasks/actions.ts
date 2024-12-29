import { createClient } from "@supabase/supabase-js";

// TODO: 향후 phone_number 대신 profile_id를 통해서 실제 전화번호나 알림 정보를 가져와서
//       카카오 메시지를 보낼 수 있게 구현할 예정.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// 일반 DB 접근용
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// pgmq용
const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * pushKakaoMessageTasks
 *  - message_targets 테이블에서 active = true 인 row들을 읽어옴
 *  - 필요한 정보(project_id, phone_number, profile_id, 등)를 메시지 큐에 기록
 */
export async function pushKakaoMessageTasks() {
  console.log(
    "[ACTION] Fetching targets from the `message_targets` table...",
  );

  // 1) message_targets 테이블에서 활성화된 레코드 전부 가져오기
  const { data: targets, error: targetsError } = await supabase
    .from("message_targets")
    .select("id, created_at, profile_id, project_id, phone_number, active")
    .eq("active", true);

  if (targetsError) {
    console.error(
      "[ERROR] Failed to fetch message_targets:",
      targetsError.message,
    );
    return { success: false, error: targetsError.message };
  }

  if (!targets || targets.length === 0) {
    console.warn(
      "[WARN] No active targets found in the `message_targets` table.",
    );
    return {
      success: false,
      error: "No active targets found in the database.",
    };
  }

  console.log(
    `[INFO] Found ${targets.length} active targets. Preparing messages...`,
  );

  // 2) 메시지 큐에 넣을 형태로 변환
  //    - 여기서는 필요한 최소한의 정보만 전송.
  //    - 추후 phone_number 대신, profile_id를 사용해서 프로필 상세 정보를 가져올 수도 있음 (TODO).
  const messages = targets.map((target) => ({
    project_id: target.project_id,
    phone_number: target.phone_number,
    // profile_id: target.profile_id, // TODO: 나중에 여기서 profile 정보를 가져와 처리할 수 있음
  }));

  console.log(
    `[INFO] Sending ${messages.length} messages to the Kakao queue.`,
  );

  // 3) 큐에 전송
  //    - 큐 이름은 예: "sending_kakao_message" 로 가정
  const { error: queueError } = await queues.rpc("send_batch", {
    queue_name: "send_kakao_message",
    messages: messages,
    sleep_seconds: 0,
  });

  if (queueError) {
    console.error(
      "[ERROR] Failed to enqueue messages:",
      queueError.message,
    );
    return { success: false, error: queueError.message };
  }

  console.log(
    `[SUCCESS] Successfully added ${messages.length} tasks to the Kakao queue.`,
  );

  return { success: true, count: messages.length };
}
