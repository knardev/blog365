import { Message, processKeywordTrackerResult } from "./actions";
import { createClient } from "@supabase/supabase-js";

// export const runtime = "edge"; // Use Edge Runtime

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize Supabase client
const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const MESSAGE_LIMIT = 10;

export async function GET(request: Request) {
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  const incomingKey = request.headers.get("X-Secret-Key");

  // Authorization check
  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(
    `[ROUTE] Fetching up to ${MESSAGE_LIMIT} messages from the queue...`,
  );

  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "blog_ranks_scrapping",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to fetch messages from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch messages" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!messages || messages.length === 0) {
    console.warn("[WARN] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(`[INFO] Retrieved ${messages.length} messages from the queue.`);

  let successCount = 0;

  for (const message of messages) {
    const processedMessage: Message = {
      tracker_id: message.message.tracker_id,
      keyword_id: message.message.keyword_id,
      project_id: message.message.project_id,
      blog_id: message.message.blog_id,
    };

    const result = await processKeywordTrackerResult(processedMessage);

    if (result.success) {
      successCount++;

      // Archive the processed message
      const { error: archiveError } = await queues.rpc("archive", {
        queue_name: "blog_ranks_scrapping",
        message_id: message.msg_id,
      });

      if (archiveError) {
        console.error(
          `[ERROR] Failed to archive message with id "${message.msg_id}":`,
          archiveError,
        );
      } else {
        console.log(`[INFO] Message with id "${message.msg_id}" archived.`);
      }
    } else {
      console.error(`[ERROR] Failed to process message:`, result.error);
    }
  }

  console.log(`[INFO] Successfully processed ${successCount} messages.`);

  return new Response(
    JSON.stringify({ success: true, processed: successCount }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
