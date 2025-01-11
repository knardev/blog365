import { pushSerpScrapingTasks } from "./actions";

// export const runtime = "edge"; // optional

export async function GET(request: Request) {
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log("[ROUTE] Starting to push SERP scraping tasks...");

  const result = await pushSerpScrapingTasks();

  if (!result.success) {
    console.error("[ERROR] Failed to push SERP scraping tasks:", result.error);
    return new Response(
      JSON.stringify({ success: false, error: result.error }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[SUCCESS] Successfully pushed ${result.count} SERP scraping tasks to the queue.`,
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: `Successfully pushed ${result.count} tasks to the queue.`,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
