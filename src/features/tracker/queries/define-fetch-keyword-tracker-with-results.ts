import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword trackers with their results, including keyword and category details
 * @param projectId - The id of the project to fetch keyword trackers for
 * @param startDate - (Optional) The start date for filtering results
 * @param endDate - (Optional) The end date for filtering results
 * @returns The Supabase query object
 */

export const defineFetchKeywordTrackerWithResultsQuery = async (
  projectId: string,
  startDate?: string,
  endDate?: string
) => {
  const query = createClient()
    .from("keyword_trackers")
    .select(`
      *,
      keywords(
        *,
        keyword_analytics (*)
      ),
      keyword_categories(*),
      keyword_tracker_results (
        date,
        blog_id,
        post_url,
        rank_in_smart_block,
        smart_block_name
      ),
      projects(slug)
    `)
    .eq("project_id", projectId);

  if (startDate || endDate) {
    query.filter('keyword_tracker_results.date', 'gte', startDate ?? '1970-01-01'); // Default start date if not provided
    query.filter('keyword_tracker_results.date', 'lte', endDate ?? '9999-12-31');  // Default end date if not provided
  }

  return query;
};

// Type for the query result
export type KeywordTrackerWithResults = QueryData<
  ReturnType<typeof defineFetchKeywordTrackerWithResultsQuery>
>;

// 예시 데이터:
/**
 * Supabase 쿼리 결과 예시:
 * [
 *   {
 *     id: "tracker-1",
 *     project_id: "project-123",
 *     name: "Keyword Tracker 1",
 *     created_at: "2023-01-01T00:00:00Z",
 *     keyword: {
 *       id: "keyword-1",
 *       name: "Keyword Example",
 *     },
 *     category: {
 *       id: "category-1",
 *       name: "Category Example",
 *     },
 *     keyword_tracker_results: [
 *       {
 *         date: "2023-01-01",
 *         blog_id: "blog-1",
 *         post_url: "https://example.com/post1",
 *         rank_in_smart_block: 5,
 *         smart_block_name: "Smart Block A"
 *       },
 *       {
 *         date: "2023-01-02",
 *         blog_id: "blog-1",
 *         post_url: "https://example.com/post3",
 *         rank_in_smart_block: 3,
 *         smart_block_name: "Smart Block A"
 *       }
 *     ]
 *   },
 *   // 추가적인 keyword_trackers...
 * ]
 */
