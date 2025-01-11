import { fetchSerpResults, saveSerpResults } from "./actions"; // Adjust import to your actual path

/**
 * POST /api/scrapping-serp-resultss
 *
 * Expects JSON:
 * {
 *   "keyword_id": string,
 *   "keyword_name": string
 * }
 */
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

    // 3) Fetch SERP data
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

    // 4) Save SERP data
    const saveResult = await saveSerpResults(keywordId, serpData);
    if (!saveResult.success) {
      console.error(`[ERROR] Failed to save SERP data: ${saveResult.error}`);
      return Response.json(
        { success: false, error: saveResult.error },
        { status: 500 },
      );
    }

    console.log(`[SUCCESS] SERP data saved for keyword: ${keywordName}`);

    // 5) Return success response
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
