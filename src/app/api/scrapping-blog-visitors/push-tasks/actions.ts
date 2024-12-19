import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize clients for both schemas
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

export async function pushScrappingBlogVisitorTasks() {
  console.log("[ACTION] Fetching blogs from the `public` schema...");
  const { data: blogs, error: blogsError } = await supabase
    .from("blogs")
    .select("id, blog_slug");

  if (blogsError) {
    console.error("[ERROR] Failed to fetch blogs:", blogsError.message);
    return { success: false, error: "Failed to fetch blogs" };
  }

  if (!blogs || blogs.length === 0) {
    console.warn("[WARN] No blogs found in the `public` schema.");
    return { success: false, error: "No blogs found in the `public` schema." };
  }

  console.log(`[ACTION] Found ${blogs.length} blogs. Preparing batch messages...`);

  // Prepare batch of messages
  const messages = blogs.map((blog) => ({
    id: blog.id,
    blog_slug: blog.blog_slug,
  }));

  console.log(`[INFO] Sending batch of ${messages.length} messages to the queue...`);
  console.log(messages);

  // Use send_batch RPC to enqueue tasks
  const { error: batchError } = await queues.rpc("send_batch", {
    queue_name: "blog_scrapping",
    messages: messages,
    sleep_seconds: 0,
  });

  if (batchError) {
    console.error("[ERROR] Failed to enqueue batch messages:", batchError);
    return { success: false, error: batchError.message };
  }

  console.log(`[SUCCESS] Batch of ${messages.length} messages successfully added to the queue.`);
  return { success: true, count: messages.length };
}
