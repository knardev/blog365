import { createClient } from "@supabase/supabase-js";
import { fetchSerpResults, saveSerpResults } from "./actions";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if a SERP result for the given keyword ID already exists for today.
 */
async function serpResultExists(keywordId: string): Promise<boolean> {
  // const today = getYesterdayInKST(); // Today is yesterday in KST
  const today = getTodayInKST();

  const { data, error } = await supabase
    .from("serp_results")
    .select("*")
    .eq("keyword_id", keywordId)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[ERROR] Error checking existing SERP result:", error);
    return false; // Assume no existing result if there's an unexpected error
  }

  return !!data; // Return true if data exists, false otherwise
}

/**
 * POST /api/scrapping-serp-resultss
 *
 * Expects JSON:
 * {
 *   "keyword_id": string,
 *   "keyword_name": string
 * }
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1) Authentication
    const envServiceRole = process.env.SUPABASE_SERVICE_ROLE ?? "";
    const incomingKey = request.headers.get("X-Secret-Key") ?? "";

    if (!envServiceRole || incomingKey !== envServiceRole) {
      return Response.json(
        { success: false, error: "Unauthorized request." },
        { status: 401 },
      );
    }

    // 2) Extract body data
    const { keyword_id: keywordId, keyword_name: keywordName } = await request
      .json();

    if (!keywordId || !keywordName) {
      return Response.json(
        {
          success: false,
          error: "Missing 'keyword_id' or 'keyword_name' in request body.",
        },
        { status: 400 },
      );
    }

    console.log(
      `[INFO] Received request to scrape SERP data for keyword: ${keywordName}`,
    );

    // 3) Check if SERP result already exists
    const alreadyExists = await serpResultExists(keywordId);
    if (alreadyExists) {
      console.log(
        `[SKIP] SERP result already exists for keyword: ${keywordName}. Skipping scrapping.`,
      );
      return Response.json(
        {
          success: true,
          message:
            `SERP result already exists for keyword "${keywordName}". No new data fetched.`,
        },
        { status: 200 },
      );
    }

    // 4) Fetch SERP data
    const serpData = await fetchSerpResults(keywordName);
    if (!serpData) {
      console.warn(`[WARN] No SERP data returned for keyword: ${keywordName}`);
      return Response.json(
        {
          success: false,
          error: "Failed to fetch SERP data from external source.",
        },
        { status: 500 },
      );
    }

    // 5) Save SERP data
    const saveResult = await saveSerpResults(keywordId, serpData);
    if (!saveResult.success) {
      console.error(`[ERROR] Failed to save SERP data: ${saveResult.error}`);
      return Response.json(
        { success: false, error: saveResult.error },
        { status: 500 },
      );
    }

    console.log(`[SUCCESS] SERP data saved for keyword: ${keywordName}`);

    // 6) Return success response
    return Response.json(
      {
        success: true,
        message:
          `Successfully scraped and saved SERP data for keyword "${keywordName}".`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      "[ERROR] Unexpected error in scrapping-serp-resultss route:",
      err,
    );
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
