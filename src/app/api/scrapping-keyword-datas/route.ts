import { createClient } from "@supabase/supabase-js";
import { processKeywordData, saveKeywordAnalytics } from "./actions";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date"; //

export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if keyword analytics already exist for the given keyword ID and date.
 */
async function keywordAnalyticsExists(keywordId: string): Promise<boolean> {
  // const today = getYesterdayInKST();
  const today = getTodayInKST();

  const { data, error } = await supabase
    .from("keyword_analytics")
    .select("*")
    .eq("keyword_id", keywordId)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[ERROR] Error checking existing keyword analytics:", error);
    return false; // Assume no existing result if an unexpected error occurs
  }

  return !!data; // Return true if data exists, false otherwise
}

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
    const { keyword_id: keywordId, keyword_name: keywordName } = await request
      .json();

    if (!keywordId || !keywordName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing keyword_id or keyword_name.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[INFO] Received keyword: ${keywordName} (ID: ${keywordId})`);

    // 4) Check if keyword analytics already exist for the given keyword ID and date
    const alreadyExists = await keywordAnalyticsExists(keywordId);
    if (alreadyExists) {
      console.log(`[SKIP] Keyword analytics already exist for: ${keywordName}`);
      return new Response(
        JSON.stringify({
          success: true,
          message:
            `Keyword analytics already exist for "${keywordName}". No new data scrapped.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5) Process the keyword data (e.g., scrapping, crawling, fetching stats)
    const keywordData = await processKeywordData(keywordName);
    if (!keywordData) {
      console.warn(`[WARN] No data returned for keyword: ${keywordName}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "No data returned during processing.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // 6) Save the resulting analytics data
    const saveResult = await saveKeywordAnalytics(keywordName, keywordData);
    if (!saveResult.success) {
      console.error(
        `[ERROR] Failed to save analytics for "${keywordName}": ${saveResult.error}`,
      );
      return new Response(
        JSON.stringify({ success: false, error: saveResult.error }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[SUCCESS] Keyword analytics saved for: ${keywordName}`);

    // 7) Return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Keyword data scrapped & saved successfully for "${keywordName}"`,
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
