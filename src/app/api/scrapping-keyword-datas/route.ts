// /app/api/scrapping-keyword-datas/route.ts

import { processKeywordData, saveKeywordAnalytics } from "./actions";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1) Check for the service role key in environment variables
    const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!envServiceRole) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Service role not configured.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2) Compare the incoming key with the environment variable
    const incomingKey = request.headers.get("X-Secret-Key");
    if (incomingKey !== envServiceRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3) Parse the request body for the keyword data
    const { keyword_id, keyword_name } = await request.json();

    if (!keyword_id || !keyword_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing keyword_id or keyword_name.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[INFO] Received keyword: ${keyword_name} (ID: ${keyword_id})`);

    // 4) Process the keyword data (e.g., scrapping, crawling, fetching stats)
    const keywordData = await processKeywordData(keyword_name);
    if (!keywordData) {
      console.warn(`[WARN] No data returned for keyword: ${keyword_name}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "No data returned during processing.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5) Save the resulting analytics data
    const saveResult = await saveKeywordAnalytics(keyword_name, keywordData);
    if (!saveResult.success) {
      console.error(
        `[ERROR] Failed to save analytics for "${keyword_name}": ${saveResult.error}`,
      );
      return new Response(
        JSON.stringify({ success: false, error: saveResult.error }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[SUCCESS] Keyword analytics saved for: ${keyword_name}`);

    // 6) Return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Keyword data scrapped & saved successfully for "${keyword_name}"`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to process keyword scrapping:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown Error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
