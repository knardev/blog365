import { createClient } from "@supabase/supabase-js";
import { TablesInsert } from "@/types/database.types";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

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

/**
 * processKeywordTrackerResult
 *
 * 1) Fetches all active blogs for the given projectId.
 * 2) For each blog, fetches blog_slug & SERP results.
 * 3) If the blog_slug is found in SERP results, inserts rows into `keyword_tracker_results`.
 */
export async function processKeywordTrackerResult({
  trackerId,
  keywordId,
  projectId,
}: {
  trackerId: string;
  keywordId: string;
  projectId: string;
}) {
  // Because we store daily SERP data by date, pick the day you need:
  const today = getTodayInKST();
  // const today = getYesterdayInKST();

  console.log(
    `[ACTION] Processing trackerId="${trackerId}" in project="${projectId}"`,
  );

  // === 1) Fetch active blogs for the given project ===
  const { data: blogs, error: blogsError } = await supabase
    .from("projects_blogs")
    .select("blog_id")
    .eq("project_id", projectId)
    .eq("active", true);

  if (blogsError) {
    console.error("[ERROR] Failed to fetch blogs:", blogsError.message);
    return { success: false, error: blogsError.message };
  }

  if (!blogs || blogs.length === 0) {
    console.warn(`[WARN] No active blogs found for project=${projectId}.`);
    return {
      success: true,
      message: "No active blogs found for this project.",
    };
  }

  console.log(
    `[INFO] Found ${blogs.length} active blogs for project=${projectId}.`,
  );

  let totalInserted = 0;

  // === 2) For each blog, perform SERP logic ===
  for (const blog of blogs) {
    const blogId = blog.blog_id;
    console.log(`\n[INFO] Processing blogId=${blogId}...`);

    // 2-A) Fetch the blog_slug
    const { data: blogData, error: blogError } = await supabase
      .from("blogs")
      .select("blog_slug")
      .eq("id", blogId)
      .single();

    if (blogError) {
      console.error(
        `[ERROR] Failed to fetch blog data for blogId=${blogId}:`,
        blogError.message,
      );
      // Skip this blog, continue with next
      continue;
    }

    const blogSlug = blogData?.blog_slug;
    if (!blogSlug) {
      console.warn(
        `[WARN] No blog_slug found for blogId=${blogId}. Skipping...`,
      );
      continue;
    }

    // 2-B) Fetch SERP results for this keyword + date
    const { data: serpResults, error: serpError } = await supabase
      .from("serp_results")
      .select("id, smart_block_datas, basic_block_datas")
      .eq("keyword_id", keywordId)
      .eq("date", today);

    if (serpError) {
      console.error(
        `[ERROR] Failed to fetch SERP results for keyword=${keywordId} on date=${today}:`,
        serpError.message,
      );
      // Continue to next blog
      continue;
    }

    if (!serpResults || serpResults.length === 0) {
      console.warn(
        `[WARN] No SERP results found for keyword=${keywordId} on ${today}.`,
      );
      // Continue to next blog
      continue;
    }

    // 2-C) Identify matching items from SERP data
    const serpResult = serpResults[0];
    const { smart_block_datas, basic_block_datas } = serpResult;

    // We'll collect items here, then insert in bulk:
    const resultsToInsert: TablesInsert<"keyword_tracker_results">[] = [];

    // Check `smart_block_datas`
    if (smart_block_datas && Array.isArray(smart_block_datas)) {
      for (const block of smart_block_datas) {
        const { items } = block;
        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
          // If the siteUrl includes the blogSlug, then record a match
          if (item.siteUrl.includes(blogSlug)) {
            resultsToInsert.push({
              keyword_tracker: trackerId,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blogId,
              smart_block_name: block.title ?? "Smart Block",
              post_url: item.postUrl,
            });
          }
        }
      }
    }

    // Check `basic_block_datas`
    if (basic_block_datas && Array.isArray(basic_block_datas)) {
      for (const block of basic_block_datas) {
        const { items } = block;
        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
          if (item.siteUrl.includes(blogSlug)) {
            resultsToInsert.push({
              keyword_tracker: trackerId,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blogId,
              smart_block_name: block.title || "Basic Block",
              post_url: item.postUrl,
            });
          }
        }
      }
    }

    if (resultsToInsert.length === 0) {
      console.log(`[INFO] No matching SERP data for blogId=${blogId}.`);
      continue;
    }

    // 2-D) Insert all matched SERP data
    console.log(
      `[INFO] Inserting ${resultsToInsert.length} rows for blogId=${blogId}...`,
    );

    const { error: insertError } = await supabase
      .from("keyword_tracker_results")
      .insert(resultsToInsert);

    if (insertError) {
      console.error(
        "[ERROR] Failed to insert keyword_tracker_results:",
        insertError.message,
      );
    } else {
      totalInserted += resultsToInsert.length;
      console.log("[SUCCESS] Inserted SERP data for this blog.");
    }
  }

  console.log(
    `[DONE] processKeywordTrackerResult: Inserted ${totalInserted} rows across all blogs in this project.`,
  );
  return { success: true, totalInserted };
}
