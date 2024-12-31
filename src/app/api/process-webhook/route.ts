// /api/webhook.js

export async function POST(request: Request) {
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const { action, payload } = await request.json();

  if (!action) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing 'action' parameter." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const supportedActions = [
    "scrapping-serp-results",
    "scrapping-blog-ranks",
    "scrapping-blog-visitors",
    "scrapping-keyword-datas",
    "scrapping-serp-results",
    "sending-kakao-message",
  ];

  if (!supportedActions.includes(action)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unsupported action: ${action}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/${action}/process-tasks`,
      {
        method: "GET",
        headers: {
          "X-Secret-Key": incomingKey || "",
        },
        // 필요 시 payload를 query params나 다른 방식으로 전달할 수 있습니다.
      },
    );

    if (response.ok) {
      console.log(`[INFO] Webhook invoked ${action} successfully.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Webhook invoked ${action} successfully.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } else {
      console.error(
        `[ERROR] Webhook invocation for ${action} failed with status:`,
        response.status,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook invocation for ${action} failed.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    console.error(
      `[ERROR] Webhook invocation for ${action} encountered an error:`,
      err,
    );
    return new Response(
      JSON.stringify({ success: false, error: "Webhook invocation error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
