import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword_tracker_results by trackerId with date range
 * @param trackerId - The tracker to fetch results for
 * @param startDate - (Optional) date >= startDate
 * @param endDate   - (Optional) date <= endDate
 * @param serviceRole - Whether the request is made with a service role key
 */
export const defineFetchKeywordTrackerResultsQuery = async (
  trackerId: string,
  startDate?: string,
  endDate?: string,
  serviceRole: boolean = false,
) => {
  const query = createClient(serviceRole)
    .from("keyword_tracker_results")
    .select(`
      date,
      blog_id,
      post_url,
      rank_in_smart_block,
      smart_block_name
    `)
    .eq("keyword_tracker", trackerId);

  if (startDate) {
    query.gte("date", startDate);
  }
  if (endDate) {
    query.lte("date", endDate);
  }

  return query;
};

/**
 * Type for the query result
 */
export type KeywordTrackerResults = QueryData<
  ReturnType<typeof defineFetchKeywordTrackerResultsQuery>
>;

/**
 * 예시 데이터:
 * [
 *   {
 *     date: "2023-01-01",
 *     blog_id: "blog-1",
 *     post_url: "https://example.com/post1",
 *     rank_in_smart_block: 5,
 *     smart_block_name: "Smart Block A"
 *   },
 *   {
 *     date: "2023-01-02",
 *     blog_id: "blog-1",
 *     post_url: "https://example.com/post3",
 *     rank_in_smart_block: 3,
 *     smart_block_name: "Smart Block A"
 *   },
 *   ...
 * ]
 */
