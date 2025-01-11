import { createClient } from "@supabase/supabase-js";
import { processBlogVisitorData } from "./actions"; // 기존 사용하던 로직 재활용

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1) 인증 로직
    const envServiceRole = process.env.SUPABASE_SERVICE_ROLE ?? "";
    const incomingKey = request.headers.get("X-Secret-Key");
    if (!envServiceRole || incomingKey !== envServiceRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2) Body 파싱: 단일 블로그 정보 수신
    const { id, blog_slug } = await request.json();
    if (!id || !blog_slug) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body. 'id' and 'blog_slug' are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3) Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "public" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // 4) 실제 로직 수행
    const result = await processBlogVisitorData(supabase, id, blog_slug);
    if (!result.success) {
      console.error(
        `[ERROR] Failed to process blog_slug "${blog_slug}": ${result.error}`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5) 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed blog_slug "${blog_slug}" successfully.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[ERROR] POST /api/scrapping-blog-visitors =>", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
