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
 * pushSerpScrapingTasks
 *
 * - Fetches all keywords in pages of PAGE_SIZE.
 * - For each page, inserts each keyword as a row into `public.message_queue`.
 * - The `task` column is set to "scrapping_serp_results".
 * - The `message` column is a JSON object: { id, name }.
 */
export async function pushSerpScrapingTasks() {
  console.log("[ACTION] Fetching keywords from the `keywords` table...");

  // A) Get the total count of keywords
  const { count, error: countError } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[ERROR] Failed to count keywords:", countError.message);
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No keywords found in the `keywords` table.");
    return { success: false, error: "No keywords found in the database." };
  }

  console.log(`[INFO] Found total ${count} keywords.`);

  let totalPushed = 0;

  // B) Pagination in blocks of PAGE_SIZE
  const totalPages = Math.ceil(count / PAGE_SIZE);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const start = pageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(
      `[INFO] Fetching keywords: page=${
        pageIndex + 1
      }/${totalPages}, range=[${start}, ${end}]`,
    );

    // C) Fetch keywords for this page
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, name")
      .range(start, end);

    if (keywordsError) {
      console.error(
        `[ERROR] Failed to fetch keywords on page ${pageIndex + 1}:`,
        keywordsError.message,
      );
      // Decide whether to continue or stop
      continue;
    }

    if (!keywords || keywords.length === 0) {
      console.log(`[INFO] No keywords on page ${pageIndex + 1}. Skipping...`);
      continue;
    }

    console.log(
      `[INFO] Inserting ${keywords.length} tasks into public.message_queue...`,
    );

    // D) Prepare rows for our custom queue table
    //    task = "scrapping_serp_results"
    //    message = JSON containing { id, name }
    const rowsToInsert = keywords.map((keyword) => ({
      task: "scrapping_serp_results",
      // status: "AVAILABLE", // or omit if default is 'AVAILABLE'
      message: { id: keyword.id, name: keyword.name },
    }));

    // E) Insert into the message_queue table
    const { data: insertData, error: insertError } = await supabase
      .from("message_queue")
      .insert(rowsToInsert); // Insert an array => batch insert

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
