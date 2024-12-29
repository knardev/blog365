import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword analytics data
 * @param keywordId - The id of the project to fetch data for (스키마에 맞춰 필요하다면 다른 파라미터 사용)
 * @returns The Supabase query object
 */

export const defineFetchKeywordAnalyticsQuery = async (
  keywordId: string,
) => {
  const query = createClient()
    .from("keyword_analytics")
    .select("*")
    .eq("keyword_id", keywordId)
    .order("date", { ascending: false })
    .limit(1);

  return query;
};

/**
 * Type for the query result
 * Supabase 의 QueryData를 이용해, defineFetchKeywordAnalyticsQuery의 반환 타입을 추론
 */
export type KeywordAnalytics = QueryData<
  ReturnType<typeof defineFetchKeywordAnalyticsQuery>
>;

/**
 * 예시 데이터:
 * [
 *   {
 *     id: "analytics-1",
 *     keyword_id: "keyword-1",
 *     project_id: "project-123",
 *     date: "2024-01-01",
 *     honey_index: 95,
 *     daily_search_volume: 100,
 *     montly_search_volume: 500,
 *     ...
 *   },
 *   ...
 * ]
 */
