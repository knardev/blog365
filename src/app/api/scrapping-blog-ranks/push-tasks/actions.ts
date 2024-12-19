import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize Supabase clients
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

export async function pushKeywordTrackerTasks() {
  console.log("[ACTION] Fetching active keyword trackers with projects...");

  // Fetch active keyword trackers with their associated projects
  const { data: trackers, error: trackersError } = await supabase
    .from("keyword_trackers")
    .select("id, keyword_id, project_id")
    .eq("active", true);

  if (trackersError) {
    console.error(
      "[ERROR] Failed to fetch keyword trackers:",
      trackersError.message,
    );
    return { success: false, error: "Failed to fetch keyword trackers" };
  }

  if (!trackers || trackers.length === 0) {
    console.warn("[WARN] No active keyword trackers found.");
    return { success: false, error: "No active keyword trackers found." };
  }

  console.log(
    `[ACTION] Found ${trackers.length} keyword trackers. Fetching associated blogs...`,
  );

  const messages: {
    tracker_id: string;
    keyword_id: string;
    project_id: string;
    blog_id: string;
  }[] = [];

  for (const tracker of trackers) {
    if (!tracker.project_id) continue;

    // Fetch active blogs associated with the tracker's project
    const { data: blogs, error: blogsError } = await supabase
      .from("projects_blogs")
      .select("blog_id")
      .eq("project_id", tracker.project_id)
      .eq("active", true);

    if (blogsError) {
      console.error(
        `[ERROR] Failed to fetch blogs for project ${tracker.project_id}:`,
        blogsError.message,
      );
      continue;
    }

    if (!blogs || blogs.length === 0) {
      console.warn(
        `[WARN] No active blogs found for project ${tracker.project_id}.`,
      );
      continue;
    }

    console.log(
      `[INFO] Found ${blogs.length} active blogs for project ${tracker.project_id}.`,
    );

    // Prepare messages for each blog
    for (const blog of blogs) {
      if (!blog.blog_id) continue;

      messages.push({
        tracker_id: tracker.id,
        keyword_id: tracker.keyword_id,
        project_id: tracker.project_id,
        blog_id: blog.blog_id,
      });
    }
  }

  if (messages.length === 0) {
    console.warn("[WARN] No messages to enqueue.");
    return { success: false, error: "No messages to enqueue." };
  }

  console.log(
    `[INFO] Sending batch of ${messages.length} messages to the queue...`,
  );

  // Enqueue messages
  const { error: batchError } = await queues.rpc("send_batch", {
    queue_name: "blog_ranks_scrapping",
    messages: messages,
    sleep_seconds: 0,
  });

  if (batchError) {
    console.error("[ERROR] Failed to enqueue batch messages:", batchError);
    return { success: false, error: batchError.message };
  }

  console.log(
    `[SUCCESS] Batch of ${messages.length} messages successfully added to the queue.`,
  );
  return { success: true, count: messages.length };
}
