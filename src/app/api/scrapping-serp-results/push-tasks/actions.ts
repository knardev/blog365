import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

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

export async function pushSerpScrapingTasks() {
  console.log("[ACTION] Fetching keywords from the `keywords` table...");

  // Fetch all keywords
  const { data: keywords, error: keywordsError } = await supabase
    .from("keywords")
    .select("id, name");

  if (keywordsError) {
    console.error("[ERROR] Failed to fetch keywords:", keywordsError.message);
    return { success: false, error: keywordsError.message };
  }

  if (!keywords || keywords.length === 0) {
    console.warn("[WARN] No keywords found in the `keywords` table.");
    return { success: false, error: "No keywords found in the database." };
  }

  console.log(
    `[INFO] Found ${keywords.length} keywords. Preparing messages...`,
  );

  // Prepare task messages
  const messages = keywords.map((keyword) => ({
    id: keyword.id,
    name: keyword.name,
  }));

  console.log(`[INFO] Sending ${messages.length} messages to the queue.`);

  // Push tasks to the queue
  const { error: queueError } = await queues.rpc("send_batch", {
    queue_name: "serp_scrapping",
    messages: messages,
    sleep_seconds: 0,
  });

  if (queueError) {
    console.error("[ERROR] Failed to enqueue messages:", queueError.message);
    return { success: false, error: queueError.message };
  }

  console.log(
    `[SUCCESS] Successfully added ${messages.length} tasks to the queue.`,
  );
  return { success: true, count: messages.length };
}
