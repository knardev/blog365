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
 *
 * 추가: 동일한 keyword_tracker, date, rank_in_smart_block, blog_id, smart_block_name, post_url 조합이 이미 있으면
 *       해당 row는 삽입하지 않고, 로그로 출력함.
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

    // 2-A) Fetch the blog_slug and related data
    const { data: blogData, error: blogError } = await supabase
      .from("blogs")
      .select("blog_slug, is_influencer, influencer_connected_blog_slug")
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

    const isInfluencer = blogData?.is_influencer;
    const influencerConnectedBlogSlug =
      blogData?.influencer_connected_blog_slug ?? "";
    // If the blog is an influencer, use the connected blog_slug
    // Otherwise, use the blog_slug
    // const blogSlug = isInfluencer
    //   ? influencerConnectedBlogSlug
    //   : blogData?.blog_slug;
    const blogSlug = blogData?.blog_slug;
    console.log(`[INFO] Found blog_slug for blogId=${blogId}: ${blogSlug}`);
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

    // 2-C) Fetch existing rows for this tracker, date, and blog to avoid duplicates
    const { data: existingRecords, error: existingError } = await supabase
      .from("keyword_tracker_results")
      .select("rank_in_smart_block, smart_block_name, post_url")
      .eq("keyword_tracker", trackerId)
      .eq("date", today)
      .eq("blog_id", blogId);

    if (existingError) {
      console.error(
        `[ERROR] Failed to fetch existing keyword_tracker_results for blogId=${blogId}:`,
        existingError.message,
      );
      // 진행할 수 없는 경우, skip
      continue;
    }

    // We'll collect items here, then insert in bulk:
    const resultsToInsert: TablesInsert<"keyword_tracker_results">[] = [];

    // 2-D) Check smart_block_datas
    if (
      serpResults[0].smart_block_datas &&
      Array.isArray(serpResults[0].smart_block_datas)
    ) {
      for (const block of serpResults[0].smart_block_datas) {
        const { items } = block;
        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
          // If the siteUrl includes the blogSlug, then record a match
          if (item.siteUrl.includes(blogSlug)) {
            const candidate = {
              keyword_tracker: trackerId,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blogId,
              smart_block_name: block.title ?? "스마트블럭",
              post_url: item.postUrl,
            };

            const duplicateExists = existingRecords?.some((record) => {
              return (
                record.rank_in_smart_block === candidate.rank_in_smart_block &&
                record.smart_block_name === candidate.smart_block_name &&
                record.post_url === candidate.post_url
              );
            });
            if (!duplicateExists) {
              resultsToInsert.push(candidate);
            } else {
              console.log(
                `[INFO] Duplicate found for blogId=${blogId} in smart_block_datas: `,
                candidate,
              );
            }
          }
        }
      }
    }

    // 2-E) Check basic_block_datas
    if (
      serpResults[0].basic_block_datas &&
      Array.isArray(serpResults[0].basic_block_datas)
    ) {
      for (const block of serpResults[0].basic_block_datas) {
        const { items } = block;
        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
          if (item.siteUrl.includes(blogSlug)) {
            const candidate = {
              keyword_tracker: trackerId,
              date: today,
              rank_in_smart_block: item.rank,
              blog_id: blogId,
              smart_block_name: block.title || "Basic Block",
              post_url: item.postUrl,
            };

            const duplicateExists = existingRecords?.some((record) => {
              return (
                record.rank_in_smart_block === candidate.rank_in_smart_block &&
                record.smart_block_name === candidate.smart_block_name &&
                record.post_url === candidate.post_url
              );
            });
            if (!duplicateExists) {
              resultsToInsert.push(candidate);
            } else {
              console.log(
                `[INFO] Duplicate found for blogId=${blogId} in basic_block_datas: `,
                candidate,
              );
            }
          }
        }
      }
    }

    if (resultsToInsert.length === 0) {
      console.log(`[INFO] No new matching SERP data for blogId=${blogId}.`);
      continue;
    }

    // 2-F) Insert all non-duplicate matched SERP data
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
