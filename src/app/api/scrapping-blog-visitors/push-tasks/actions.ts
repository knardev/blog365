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

const PAGE_SIZE = 1000;

/**
 * pushScrappingBlogVisitorTasks
 *
 * - Fetches all blogs in pages of PAGE_SIZE.
 * - For each page, inserts each blog as a row into `public.message_queue`.
 * - The `task` column is set to "scrapping_blog_visitor".
 * - The `message` column is a JSON object: { id, blog_slug }.
 */
export async function pushScrappingBlogVisitorTasks() {
  console.log("[ACTION] Fetching blogs from the `blogs` table...");

  // A) Get the total count of blogs
  const { count, error: countError } = await supabase
    .from("blogs")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[ERROR] Failed to count blogs:", countError.message);
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No blogs found in the `blogs` table.");
    return { success: false, error: "No blogs found in the database." };
  }

  console.log(`[INFO] Found total ${count} blogs.`);

  let totalPushed = 0;

  // B) Pagination in blocks of PAGE_SIZE
  const totalPages = Math.ceil(count / PAGE_SIZE);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const start = pageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(
      `[INFO] Fetching blogs: page=${
        pageIndex + 1
      }/${totalPages}, range=[${start}, ${end}]`,
    );

    // C) Fetch blogs for this page
    const { data: blogs, error: blogsError } = await supabase
      .from("blogs")
      .select("id, blog_slug")
      .range(start, end);

    if (blogsError) {
      console.error(
        `[ERROR] Failed to fetch blogs on page ${pageIndex + 1}:`,
        blogsError.message,
      );
      continue; // Skip this page if there's an error
    }

    if (!blogs || blogs.length === 0) {
      console.log(`[INFO] No blogs on page ${pageIndex + 1}. Skipping...`);
      continue;
    }

    console.log(
      `[INFO] Inserting ${blogs.length} tasks into public.message_queue...`,
    );

    // D) Prepare rows for our custom queue table
    //    task = "scrapping_blog_visitor"
    //    message = JSON containing { id, blog_slug }
    const rowsToInsert = blogs.map((blog) => ({
      task: "scrapping_blog_visitor",
      message: { id: blog.id, blog_slug: blog.blog_slug },
    }));

    // E) Insert into the message_queue table
    const { data: insertData, error: insertError } = await supabase
      .from("message_queue")
      .insert(rowsToInsert);

    if (insertError) {
      console.error(
        "[ERROR] Failed to insert queue rows:",
        insertError.message,
      );
      continue;
    }

    totalPushed += rowsToInsert.length;
    console.log(
      `[SUCCESS] Added ${rowsToInsert.length} tasks (page ${pageIndex + 1}).`,
    );
  }

  console.log(`[RESULT] Total ${totalPushed} tasks added to the queue.`);
  return { success: true, count: totalPushed };
}
