import { createClient } from "@supabase/supabase-js";
import { TablesInsert } from "@/types/database.types";

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

export interface Message {
  tracker_id: string;
  keyword_id: string;
  project_id: string;
  blog_id: string;
}

export async function processKeywordTrackerResult(message: Message) {
  const { tracker_id, keyword_id, blog_id } = message;
  const today = new Date().toISOString().split("T")[0];
  const resultsToInsert: TablesInsert<"keyword_tracker_results">[] = [];

  console.log(
    `[ACTION] Processing message for tracker_id: ${tracker_id}, blog_id: ${blog_id}`,
  );

  // Fetch the blog_slug for the given blog_id
  const { data: blogData, error: blogError } = await supabase
    .from("blogs")
    .select("blog_slug")
    .eq("id", blog_id)
    .single();

  if (blogError) {
    console.error(
      `[ERROR] Failed to fetch blog data for blog_id ${blog_id}:`,
      blogError.message,
    );
    return { success: false, error: blogError.message };
  }

  const blogSlug = blogData?.blog_slug;

  if (!blogSlug) {
    console.warn(
      `[WARN] No blog_slug found for blog_id ${blog_id}. Skipping processing.`,
    );
    return { success: false, message: "No blog_slug found." };
  }

  console.log(`[INFO] Blog_slug for blog_id ${blog_id}: ${blogSlug}`);

  // Fetch SERP results for the keyword and today's date
  const { data: serpResults, error: serpError } = await supabase
    .from("serp_results")
    .select("id, smart_block_datas, basic_block_datas")
    .eq("keyword_id", keyword_id)
    .eq("date", today);

  if (serpError) {
    console.error(
      `[ERROR] Failed to fetch SERP results for keyword ${keyword_id}:`,
      serpError.message,
    );
    return { success: false, error: serpError.message };
  }

  if (!serpResults || serpResults.length === 0) {
    console.warn(
      `[WARN] No SERP results found for keyword ${keyword_id} on ${today}.`,
    );
    return { success: false, message: "No SERP results found." };
  }

  // Extract data from `smart_block_datas` and `basic_block_datas`
  for (const serpResult of serpResults) {
    const { smart_block_datas, basic_block_datas } = serpResult;

    // Process `smart_block_datas`
    if (smart_block_datas && Array.isArray(smart_block_datas)) {
      for (const block of smart_block_datas) {
        const { items } = block;

        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
          if (item.isBlog && item.siteUrl.includes(blogSlug)) {
            resultsToInsert.push({
              keyword_tracker: tracker_id,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blog_id,
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
          if (item.isBlog && item.siteUrl.includes(blogSlug)) {
            resultsToInsert.push({
              keyword_tracker: tracker_id,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blog_id,
              smart_block_name: block.title || "Basic Block", // Use "Basic Block" if no title is available
              post_url: item.postUrl,
            });
          }
        }
      }
    }
  }

  if (resultsToInsert.length === 0) {
    console.warn(
      `[WARN] No data to insert for tracker_id: ${tracker_id}, blog_id: ${blog_id}`,
    );
    return { success: true, message: "No data to insert." };
  }

  console.log(
    `[INFO] Inserting ${resultsToInsert.length} rows for tracker_id: ${tracker_id}, blog_id: ${blog_id}`,
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
