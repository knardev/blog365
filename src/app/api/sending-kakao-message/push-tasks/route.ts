import { pushKakaoMessageTasks } from "./actions";

// export const runtime = "edge"; // (원한다면 사용)

export async function GET(_request: Request) {
  const incomingKey = _request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  // 1) 인증 체크
  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log("[ROUTE] Starting to push Kakao message tasks...");

  // 2) 메시지 큐에 작업 추가
  const result = await pushKakaoMessageTasks();

  if (!result.success) {
    console.error("[ERROR] Failed to push Kakao message tasks:", result.error);
    return new Response(
      JSON.stringify({ success: false, error: result.error }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[SUCCESS] Successfully pushed ${result.count} Kakao message tasks to the queue.`,
  );

  // 3) 응답
  return new Response(
    JSON.stringify({
      success: true,
      message:
        `Successfully pushed ${result.count} Kakao message tasks to the queue.`,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
