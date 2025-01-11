import { processKeywordTrackerResult } from "./actions";
import { createClient } from "@supabase/supabase-js";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 오늘 날짜 데이터가 이미 존재하는지 확인하는 함수
 * @param trackerId - Keyword Tracker ID
 * @returns {Promise<boolean>} 이미 존재하면 true, 없으면 false
 */
async function trackerResultExists(trackerId: string): Promise<boolean> {
  const today = getYesterdayInKST();
  // const today = getTodayInKST();

  const { data, error } = await supabase
    .from("keyword_tracker_results")
    .select("*")
    .eq("keyword_tracker", trackerId)
    .eq("date", today)
    .single(); // single()을 사용하여 한 개의 결과만 가져옴

  if (error && error.code !== "PGRST116") {
    console.error("[INFO] There are no existing data");
    return false;
  }

  // data가 있으면 true, 없으면 false 반환
  return !!data;
}

export async function POST(request: Request) {
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

  // 3) Parse the request body for the keyword data
  const {
    tracker_id: trackerId,
    keyword_id: keywordId,
    project_id: projectId,
  } = await request
    .json();

  if (!trackerId || !keywordId || !projectId) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Invalid request body. 'tracker_id', 'keyword_id', 'project_id' are required.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[INFO] Processing tracker result for tracker_id: ${trackerId}`,
  );

  try {
    // 4) Check if keyword tracker already exist for the given tracker ID and date
    const alreadyExists = await trackerResultExists(trackerId);
    if (alreadyExists) {
      console.log(
        `[SKIP] Tracker result already exists for tracker_id="${trackerId}". Skipping...`,
      );

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5) Process the keyword tracker result
    const result = await processKeywordTrackerResult({
      trackerId,
      keywordId,
      projectId,
    });
    if (!result.success) {
      console.error(
        `[ERROR] Failed to process tracker result for tracker_id="${trackerId}":`,
        result.error,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // 6) 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed tracker_id "${trackerId}" successfully.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      `[ERROR] Failed to process tracker result for tracker_id="${trackerId}":`,
      err,
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: err,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
