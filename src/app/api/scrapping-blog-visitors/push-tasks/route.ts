import { pushScrappingBlogVisitorTasks } from "./actions";

export const runtime = "edge"; // Edge Runtime 설정

export async function GET(_request: Request) {
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Service role not configured." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const incomingKey = _request.headers.get("X-Secret-Key");

  // 인증 로직: 요청 헤더와 환경 변수 비교
  if (incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const result = await pushScrappingBlogVisitorTasks();
  return new Response(
    JSON.stringify(result),
    {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    },
  );
}