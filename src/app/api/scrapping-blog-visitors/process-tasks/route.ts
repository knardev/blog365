import { createClient } from "@supabase/supabase-js";
import { processBlogVisitorData, QueueMessage } from "./actions";

export const maxDuration = 3;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

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

  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[ROUTE] Fetching up to ${MESSAGE_LIMIT} messages from the queue...`,
  );

  // 1) Fetch messages from the queue
  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "blog_scrapping",
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
    console.warn("[WARN] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[INFO] Retrieved ${messages.length} messages from the queue.`);

  // 2) Process messages in parallel using Promise.all
  const results = await Promise.all(
    messages.map(async (message: QueueMessage) => {
      const blog_id = message.message.id;
      const blog_slug = message.message.blog_slug;

      try {
        console.log(
          `[INFO] Processing message with blog_slug "${blog_slug}"...`,
        );

        const result = await processBlogVisitorData(
          supabase,
          blog_id,
          blog_slug,
        );

        if (!result.success) {
          console.error(
            `[ERROR] Failed to process message with blog_slug "${blog_slug}": ${result.error}`,
          );
          return false;
        }

        console.log(
          `[SUCCESS] Message with blog_slug "${blog_slug}" processed successfully.`,
        );

        // Archive the processed message
        const { error: archiveError } = await queues.rpc("archive", {
          queue_name: "blog_scrapping",
          message_id: message.msg_id,
        });

        if (archiveError) {
          console.error(
            `[ERROR] Failed to archive message with id "${message.msg_id}":`,
            archiveError,
          );
        } else {
          console.log(
            `[INFO] Message with id "${message.msg_id}" archived from the queue.`,
          );
        }

        return true;
      } catch (err) {
        console.error(
          `[ERROR] Failed to process message with blog_slug "${blog_slug}":`,
          err,
        );
        return false;
      }
    }),
  );

  const successCount = results.filter((res) => res).length;
  console.log(
    `[INFO] Successfully processed ${successCount}/${messages.length} messages.`,
  );

  // 3) Check for more messages and self-invoke if needed
  try {
    const { data: leftoverMessages, error: leftoverError } = await queues.rpc(
      "read",
      {
        queue_name: "blog_scrapping",
        sleep_seconds: 0,
        n: 1,
      },
    );

    if (leftoverError) {
      console.warn("[WARN] Checking leftover messages failed:", leftoverError);
    } else if (leftoverMessages && leftoverMessages.length > 0) {
      console.log("[INFO] More messages remain in the queue. Self-invoking...");

      fetch(request.url, {
        method: "GET",
        headers: {
          "X-Secret-Key": incomingKey ?? "",
        },
      })
        .then(() => {
          console.log("[INFO] Self invocation triggered successfully.");
        })
        .catch((err) => {
          console.error("[ERROR] Failed to self-invoke:", err);
        });
    } else {
      console.log("[INFO] No more messages left in the queue.");
    }
  } catch (err) {
    console.error("[ERROR] Self-invocation check failed:", err);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message:
        `Process Queue Messages completed. Successfully processed ${successCount}/${messages.length} messages.`,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
