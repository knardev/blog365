import { scrapSingleTrackerResult } from "./actions";

export const maxDuration = 60;

export async function POST(request: Request) {
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const {
      projectId,
      trackerId,
      keywordId,
      keywordName,
    } = await request
      .json();

    if (!projectId || !trackerId || !keywordId || !keywordName) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await scrapSingleTrackerResult({
      projectId,
      trackerId,
      keywordId,
      keywordName,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: "Scraping failed." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scraping successful.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[ERROR] Exception in API route:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
