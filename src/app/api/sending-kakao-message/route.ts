import { createClient } from "@supabase/supabase-js";
import { sendKakaoMessageAction } from "./actions";

// export const runtime = "edge"; // (원한다면 사용)
export const maxDuration = 5;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
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

  const { project_id: projectId, phone_number: phoneNumber } = await request
    .json();

  if (!projectId || !phoneNumber) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const actionResult = await sendKakaoMessageAction(
    projectId,
    phoneNumber,
  );

  if (!actionResult.success) {
    console.error(
      "[ERROR] Failed to send Kakao message:",
      actionResult.error,
    );
    return new Response(
      JSON.stringify({ success: false, error: actionResult.error }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log("[INFO] Successfully sent Kakao message:");

  return new Response(
    JSON.stringify({
      success: true,
      message: "Successfully sent Kakao message.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
