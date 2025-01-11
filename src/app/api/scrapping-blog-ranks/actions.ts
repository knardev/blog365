import { createClient } from "@supabase/supabase-js";
import { TablesInsert } from "@/types/database.types";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

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

export async function processKeywordTrackerResult(
  { trackerId, keywordId, blogId }: {
    trackerId: string;
    keywordId: string;
    blogId: string;
  },
) {
  // console.log("[ACTION] Processing message:", message);
  // const today = getTodayInKST();
  const today = getYesterdayInKST();
  const resultsToInsert: TablesInsert<"keyword_tracker_results">[] = [];

  console.log(
    `[ACTION] Processing message for trackerId: ${trackerId}, blogId: ${blogId}`,
  );

  // Fetch the blog_slug for the given blogId
  const { data: blogData, error: blogError } = await supabase
    .from("blogs")
    .select("blog_slug")
    .eq("id", blogId)
    .single();

  if (blogError) {
    console.error(
      `[ERROR] Failed to fetch blog data for blogId ${blogId}:`,
      blogError.message,
    );
    return { success: false, error: blogError.message };
  }

  const blogSlug = blogData?.blog_slug;

  if (!blogSlug) {
    console.warn(
      `[WARN] No blog_slug found for blogId ${blogId}. Skipping processing.`,
    );
    return { success: false, message: "No blog_slug found." };
  }

  console.log(`[INFO] Blog_slug for blogId ${blogId}: ${blogSlug}`);

  // Fetch SERP results for the keyword and today's date
  const { data: serpResults, error: serpError } = await supabase
    .from("serp_results")
    .select("id, smart_block_datas, basic_block_datas")
    .eq("keywordId", keywordId)
    .eq("date", today);

  if (serpError) {
    console.error(
      `[ERROR] Failed to fetch SERP results for keyword ${keywordId}:`,
      serpError.message,
    );
    return { success: false, error: serpError.message };
  }

  if (!serpResults || serpResults.length === 0) {
    console.warn(
      `[WARN] No SERP results found for keyword ${keywordId} on ${today}.`,
    );
    return { success: true, message: "No SERP results found." };
  }

  // Extract data from `smart_block_datas` and `basic_block_datas`
  const serpResult = serpResults[0];
  const { smart_block_datas, basic_block_datas } = serpResult;

  // Process `smart_block_datas`
  if (smart_block_datas && Array.isArray(smart_block_datas)) {
    for (const block of smart_block_datas) {
      const { items } = block;

      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        if (item.siteUrl.includes(blogSlug)) {
          // if (item.isBlog && item.siteUrl.includes(blogSlug)) {
          resultsToInsert.push({
            keyword_tracker: trackerId,
            date: today,
            rank_in_smart_block: item.rank,
            blog_id: blogId,
            smart_block_name: block.title,
            post_url: item.postUrl,
          });
        }
      }
    }
  }

  // Process `basic_block_datas`
  if (basic_block_datas && Array.isArray(basic_block_datas)) {
    for (const block of basic_block_datas) {
      const { items } = block;

      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        if (item.siteUrl.includes(blogSlug)) {
          // if (item.isBlog && item.siteUrl.includes(blogSlug)) {
          resultsToInsert.push({
            keyword_tracker: trackerId,
            date: today,
            rank_in_smart_block: item.rank,
            blog_id: blogId,
            smart_block_name: block.title || "Basic Block", // Use "Basic Block" if no title is available
            post_url: item.postUrl,
          });
        }
      }
    }
  }

  if (resultsToInsert.length === 0) {
    console.log(
      `[INFO] No data to insert for trackerId: ${trackerId}, blogId: ${blogId}`,
    );
    return { success: true, message: "No data to insert." };
  }

  console.log(
    `[INFO] Inserting ${resultsToInsert.length} rows for trackerId: ${trackerId}, blogId: ${blogId}`,
  );

  // Batch insert into keyword_tracker_results
  const { error: insertError } = await supabase
    .from("keyword_tracker_results")
    .insert(resultsToInsert);

  if (insertError) {
    console.error(
      "[ERROR] Failed to insert keyword_tracker_results:",
      insertError.message,
    );
    return { success: false, error: insertError.message };
  }

  console.log("[SUCCESS] Keyword tracker results inserted successfully.");
  return { success: true, count: resultsToInsert.length };
}
