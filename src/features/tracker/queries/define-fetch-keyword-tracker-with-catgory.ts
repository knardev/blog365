import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword trackers with their categories, and project slug.
 * 'keyword_tracker_results'나 'keyword_analytics'는 가져오지 않습니다.
 *
 * @param projectId - The id of the project to fetch keyword trackers for
 * @param serviceRole - Whether the request is made with a service role key
 * @returns Supabase query object
 */
export const defineFetchKeywordTrackerWithCategoriesQuery = (
  projectId: string,
  serviceRole: boolean = false,
  range?: { offset: number; limit: number },
) => {
  let query = createClient(serviceRole)
    .from("keyword_trackers")
    .select(`
      *,
      keywords(*),
      keyword_categories(*),
      projects(slug)
    `)
    .eq("project_id", projectId)
    .eq("delete_state", false)
    .order("created_at", { ascending: true });

  // 페이지네이션 추가
  if (range) {
    query = query.range(range.offset, range.offset + range.limit - 1);
  }

  return query;
};

/**
 * Type for the query result
 * `ReturnType<typeof defineFetchKeywordTrackerWithCategoriesQuery>` 의
 * Promise 내부 값(QueryData)을 추론합니다.
 */
export type KeywordTrackerWithCategories = QueryData<
  ReturnType<typeof defineFetchKeywordTrackerWithCategoriesQuery>
>;

/**
 * 예시 데이터:
 * [
 *   {
 *     id: "tracker-1",
 *     project_id: "project-123",
 *     name: "Keyword Tracker 1",
 *     created_at: "2023-01-01T00:00:00Z",
 *     keywords: {
 *       id: "keyword-1",
 *       name: "Keyword Example",
 *       ...
 *     },
 *     keyword_categories: {
 *       id: "category-1",
 *       name: "Category Example",
 *       ...
 *     },
 *     projects: {
 *       slug: "my-project"
 *     }
 *     // 여기에는 keyword_tracker_results, keyword_analytics는 아직 없음
 *   },
 *   ...
 * ]
 */
