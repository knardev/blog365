import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const PAGE_SIZE = 1000; // Number of keyword trackers to fetch per page

/**
 * pushKeywordTrackerTasks
 *
 * - Fetches all active keyword trackers in pages of PAGE_SIZE.
 * - For each page, inserts rows into `public.message_queue` with:
 *   - task = "scrapping_blog_ranks"
 *   - message = JSON containing { tracker_id, keyword_id, project_id } (no blog_id)
 */
export async function pushKeywordTrackerTasks() {
  console.log("[ACTION] Fetching total count of active keyword trackers...");

  // A) Get the total count of active keyword trackers
  const { count, error: countError } = await supabase
    .from("keyword_trackers")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (countError) {
    console.error(
      "[ERROR] Failed to fetch keyword tracker count:",
      countError.message,
    );
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No active keyword trackers found.");
    return { success: false, error: "No active keyword trackers found." };
  }

  console.log(`[INFO] Found ${count} active keyword trackers.`);

  let totalPushed = 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  // B) Process each page in sequence
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    console.log(`[INFO] Fetching page ${pageIndex + 1}/${totalPages}...`);

    const { data: trackers, error: trackersError } = await supabase
      .from("keyword_trackers")
      .select("id, keyword_id, project_id")
      .eq("active", true)
      .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

    if (trackersError) {
      console.error(
        `[ERROR] Failed to fetch keyword trackers for page ${pageIndex + 1}:`,
        trackersError.message,
      );
      continue;
    }

    if (!trackers || trackers.length === 0) {
      console.warn(
        `[WARN] No keyword trackers found for page ${pageIndex + 1}.`,
      );
      continue;
    }

    console.log(`[INFO] Fetched ${trackers.length} keyword trackers.`);

    // C) Generate messages for the queue (no blog_id here)
    const messages = trackers.map((tracker) => ({
      task: "scrapping_blog_ranks",
      message: {
        tracker_id: tracker.id,
        keyword_id: tracker.keyword_id,
        project_id: tracker.project_id,
      },
    }));

    if (messages.length === 0) {
      console.warn(`[WARN] No messages generated for page ${pageIndex + 1}.`);
      continue;
    }

    console.log(
      `[INFO] Preparing to insert ${messages.length} messages into the queue.`,
    );

    // D) Insert messages into the message queue
    const { error: insertError } = await supabase
      .from("message_queue")
      .insert(messages);

    if (insertError) {
      console.error(
        `[ERROR] Failed to insert messages for page ${pageIndex + 1}:`,
        insertError.message,
      );
      continue;
    }

    totalPushed += messages.length;
    console.log(
      `[SUCCESS] Inserted ${messages.length} messages for page ${
        pageIndex + 1
      }.`,
    );
  }

  console.log(`[RESULT] Total ${totalPushed} messages added to the queue.`);
  return { success: true, count: totalPushed };
}
