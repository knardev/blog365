import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword trackers with their results, including keyword and category details
 * @param projectId - The id of the project to fetch keyword trackers for
 * @returns The Supabase query object
 */

export const defineFetchKeywordTrackerQuery = async (
  projectId: string,
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
      projects(slug)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return query;
};

// Type for the query result
export type KeywordTracker = QueryData<
  ReturnType<typeof defineFetchKeywordTrackerQuery>
>[number];

// 예시 데이터:
/**
 * Supabase 쿼리 결과 예시:
 * [
 *   {
 *     id: "tracker-1",
 *     project_id: "project-123",
 *     keyword_id: "keyword-1",
 *     category_id: "category-1",
 *     active: true,
 *     status: "WAITING",
 *     created_at: "2023-01-01T00:00:00Z",
 *     keywords: {
 *       id: "keyword-1",
 *       name: "Keyword Example",
 *       created_at: "2023-01-01T00:00:00Z",
 *       keyword_analytics: [
 *         {
 *           id: "analytic-1",
 *           date: "2023-01-01",
 *           created_at: "2023-01-01T00:00:00Z",
 *           keyword_id: "keyword-1",
 *           daily_search_volume: 100,
 *           monthly_search_volume: 1000,
 *           monthly_issue_volume: 50,
 *           honey_index: 85
 *         },
 *         // 추가적인 analytics...
 *       ]
 *     },
 *     keyword_categories: {
 *       id: "category-1",
 *       name: "Category Example",
 *       created_at: "2023-01-01T00:00:00Z"
 *     },
 *     projects: {
 *       slug: "example-project"
 *     }
 *   },
 *   {
 *     id: "tracker-2",
 *     project_id: "project-123",
 *     keyword_id: "keyword-2",
 *     category_id: null,
 *     active: false,
 *     status: "INACTIVE",
 *     created_at: "2023-02-01T00:00:00Z",
 *     keywords: {
 *       id: "keyword-2",
 *       name: "Another Keyword Example",
 *       created_at: "2023-02-01T00:00:00Z",
 *       keyword_analytics: []
 *     },
 *     keyword_categories: null,
 *     projects: {
 *       slug: "example-project"
 *     }
 *   }
 * ]
 */
