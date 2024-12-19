import { createClient } from "@supabase/supabase-js";
import { processKeywordData, saveKeywordAnalytics } from "./actions";

// export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const MESSAGE_LIMIT = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const incomingKey = request.headers.get("X-Secret-Key");
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "keyword_data_scrapping",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to fetch messages from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch messages" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!messages || messages.length === 0) {
    console.log("[INFO] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  for (const message of messages) {
    const keyword = message.message.name;

    console.log(`[ACTION] Processing keyword: ${keyword}`);

    await delay(1000);

    const keywordData = await processKeywordData(keyword);

    if (!keywordData) {
      console.warn(`[WARN] No data returned for keyword: ${keyword}`);
      continue;
    }

    const saveResult = await saveKeywordAnalytics(keyword, keywordData);

    if (!saveResult.success) {
      console.error(
        `[ERROR] Failed to save analytics data for keyword "${keyword}":`,
        saveResult.error,
      );
      continue;
    }

    console.log(`[SUCCESS] Analytics data saved for keyword: ${keyword}`);

    const { error: archiveError } = await queues.rpc("archive", {
      queue_name: "keyword_data_scrapping",
      message_id: message.msg_id,
    });

    if (archiveError) {
      console.error(
        `[ERROR] Failed to archive message with id "${message.msg_id}":`,
        archiveError,
      );
    } else {
      console.log(`[INFO] Message archived with id: ${message.msg_id}`);
    }
  }

  console.log("[INFO] All messages processed.");
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
