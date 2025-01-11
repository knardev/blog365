import { createClient } from "@supabase"; // Deno-compatible supabase client

/**
 * Delay function that returns a Promise resolved after `ms` milliseconds.
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Configurable constants */
const CONCURRENCY_LIMIT = 20;
const PAGE_SIZE = 1000;

/** Initialize Supabase client once at the top level */
const SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  throw new Error("Supabase URL or Service Role Key is not configured.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

Deno.serve((req: Request) => {
  try {
    // 1) Authentication
    const incomingKey = req.headers.get("X-Secret-Key") ?? "";
    if (
      !SUPABASE_SERVICE_ROLE_KEY || incomingKey !== SUPABASE_SERVICE_ROLE_KEY
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2) Background logic
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log("[INFO] Starting blog visitor queue-processing task...");

          // A) Count total AVAILABLE + scrapping_blog_visitor messages
          const { count, error: countError } = await supabase
            .from("message_queue")
            .select("*", { head: true, count: "exact" })
            .eq("status", "AVAILABLE")
            .eq("task", "scrapping_blog_visitor");

          if (countError) {
            console.error(
              "[ERROR] Failed to count queue messages:",
              countError,
            );
            return;
          }

          if (!count || count === 0) {
            console.log("[INFO] No messages found in the queue. Done.");
            return;
          }

          console.log(`[INFO] Found ${count} queue messages to process.`);

          const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
          if (!baseUrl) {
            console.error("[ERROR] NEXT_BASE_URL not configured.");
            return;
          }

          // B) Calculate total pages
          const totalPages = Math.ceil(count / PAGE_SIZE);
          console.log(`[INFO] Splitting into ${totalPages} pages.`);

          // C) Process each page in sequence
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const start = pageIndex * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            console.log(
              `[INFO] Fetching messages page ${
                pageIndex + 1
              }/${totalPages}, range=[${start}, ${end}]`,
            );

            // Fetch up to PAGE_SIZE messages with status=AVAILABLE, task=scrapping_blog_visitor
            const { data: messages, error: msgError } = await supabase
              .from("message_queue")
              .select("id, message")
              .eq("status", "AVAILABLE")
              .eq("task", "scrapping_blog_visitor")
              .range(start, end);

            if (msgError) {
              console.error(
                "[ERROR] Failed to fetch messages:",
                msgError.message,
              );
              continue;
            }

            if (!messages || messages.length === 0) {
              console.log(
                `[INFO] Page ${pageIndex + 1} has no messages. Skipping.`,
              );
              continue;
            }

            console.log(
              `[INFO] Page ${pageIndex + 1} has ${messages.length} messages.`,
            );

            // D) Concurrency-limited processing
            await processQueueMessages(messages, baseUrl);

            console.log(`[INFO] Finished page ${pageIndex + 1}/${totalPages}.`);
          }

          console.log("[INFO] All queue messages processed successfully.");
        } catch (err) {
          console.error("[ERROR] Exception in queue-processing task:", err);
        }
      })(),
    );

    // Immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Queue-processing started with concurrency limit=${CONCURRENCY_LIMIT}.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start queue-processing:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * processQueueMessages
 *
 * Concurrency-limited. For each message:
 * - Sends a POST request to baseUrl + "/api/scrapping-blog-visitors"
 * - If successful, updates message status to 'ARCHIVED'
 */
async function processQueueMessages(
  messages: { id: number; message: { id: number; blog_slug: string } }[],
  baseUrl: string,
) {
  let currentIndex = 0;
  let inFlight = 0;
  const total = messages.length;

  while (currentIndex < total || inFlight > 0) {
    // 1) If we have capacity and items left, launch new requests
    while (inFlight < CONCURRENCY_LIMIT && currentIndex < total) {
      const msg = messages[currentIndex++];
      inFlight++;
      console.log(
        `[DEBUG] inFlight++ → ${inFlight} (Launching message_id=${msg.id})`,
      );

      const { id: blogId, blog_slug: blogSlug } = msg.message || {};

      fetch(`${baseUrl}/api/scrapping-blog-visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          id: blogId,
          blog_slug: blogSlug,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            console.error(
              `[ERROR] Request failed for message_id=${msg.id}:`,
              await res.text(),
            );
          } else {
            console.log(`[SUCCESS] Processed message_id=${msg.id}.`);

            // Update status to ARCHIVED on success
            const { error: updateErr } = await supabase
              .from("message_queue")
              .update({ status: "ARCHIVED" })
              .eq("id", msg.id);

            if (updateErr) {
              console.error(
                `[ERROR] Failed to archive message_id=${msg.id}:`,
                updateErr.message,
              );
            } else {
              console.log(`[INFO] Archived message_id=${msg.id} successfully.`);
            }
          }
        })
        .catch((err) => {
          console.error(`[ERROR] Fetch error for message_id=${msg.id}:`, err);
        })
        .finally(() => {
          inFlight--;
          console.log(
            `[DEBUG] inFlight-- → ${inFlight} (Finished message_id=${msg.id})`,
          );
        });
    }

    // 2) If we still have items not started, or requests in flight, wait a bit
    if (currentIndex < total || inFlight > 0) {
      await delay(500);
    }
  }
}
