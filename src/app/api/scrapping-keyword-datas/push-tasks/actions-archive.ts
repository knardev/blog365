import { createClient } from "@supabase/supabase-js";

// 1) Initialize Supabase
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

// 2) Constants
const PAGE_SIZE = 1000;

/**
 * pushKeywordScrapingTasks
 *
 * - Fetches all keywords in pages of PAGE_SIZE.
 * - For each page, inserts each keyword as a row into `public.message_queue`.
 * - The `task` column is set to "scrapping_keyword_datas".
 * - The `message` column is a JSON object: { id, name }.
 */
export async function pushKeywordScrapingTasks() {
  console.log("[ACTION] Fetching total keyword count...");

  // A) Get the total count of keywords
  const { count, error: countError } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[ERROR] Failed to fetch keyword count:", countError.message);
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No keywords found in the `keywords` table.");
    return { success: false, error: "No keywords found in the database." };
  }

  console.log(`[INFO] Found total ${count} keywords.`);

  let totalPushed = 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  // B) Process keywords page by page
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const start = pageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(
      `[INFO] Fetching keywords: page=${
        pageIndex + 1
      }/${totalPages}, range=[${start}, ${end}]`,
    );

    // Fetch up to PAGE_SIZE keywords for this page
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, name")
      .range(start, end);

    if (keywordsError) {
      console.error(
        `[ERROR] Failed to fetch keywords on page ${pageIndex + 1}:`,
        keywordsError.message,
      );
      continue;
    }

    if (!keywords || keywords.length === 0) {
      console.log(`[INFO] No keywords on page ${pageIndex + 1}. Skipping...`);
      continue;
    }

    console.log(
      `[INFO] Inserting ${keywords.length} tasks into public.message_queue...`,
    );

    // Prepare rows for insertion into the message queue
    const rowsToInsert = keywords.map((keyword) => ({
      task: "scrapping_keyword_datas", // Set task type
      message: { id: keyword.id, name: keyword.name }, // JSON payload
    }));

    // Insert rows into the `message_queue` table
    const { error: insertError } = await supabase
      .from("message_queue")
      .insert(rowsToInsert);

    if (insertError) {
      console.error(
        `[ERROR] Failed to insert queue rows for page ${pageIndex + 1}:`,
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
