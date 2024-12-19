"use server";

import { defineFetchKeywordTrackerWithResultsQuery } from "../queries/define-fetch-keyword-tracker-with-results";
import { KeywordTrackerWithResults, KeywordTrackerResultsMap, DailyResult, CatchResult } from "../types/types";
import { createClient } from "@/utils/supabase/server";

/**
 * Action to fetch keyword trackers and transform the data
 * @param projectSlug - The slug of the project to fetch keyword trackers for
 * @param startDate - (Optional) The start date for filtering results
 * @param endDate - (Optional) The end date for filtering results
 * @returns Transformed keyword trackers with results
 */

export async function fetchKeywordTrackerWithResults(
  projectSlug: string,
  startDate?: string,
  endDate?: string
): Promise<KeywordTrackerWithResults[] | null> {
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single(); // single() ensures only one project is fetched

    if (projectError) {
      console.error("Error fetching project by slug:", projectError);
      return null;
    }

    const projectId = projectData?.id;


  // Fetch keyword trackers and results
  const query = await defineFetchKeywordTrackerWithResultsQuery(projectId, startDate, endDate);

  const { data, error } = query;
  
  if (error) {
    console.error("Error fetching keyword tracker with results:", error);
    throw new Error("Failed to fetch keyword tracker with results");
  }

  // Transform data into KeywordTrackerWithResults[]
  const transformedData: KeywordTrackerWithResults[] = data.map((tracker) => {
    const resultsMap: KeywordTrackerResultsMap = {};

    // Process keyword_tracker_results
    tracker.keyword_tracker_results.forEach((result) => {
      const date = result.date;
      if (!resultsMap[date]) {
        resultsMap[date] = { catch_success: 0, catch_result: [] };
      }

      resultsMap[date].catch_success += 1;

      resultsMap[date].catch_result.push({
        post_url: result.post_url ?? "N/A",
        rank_in_smart_block: result.rank_in_smart_block ?? -1,
      });
    });

    // Filter keyword_analytics to retain only the most recent entry
    const latestKeywordAnalytics =
      tracker.keywords?.keyword_analytics?.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] ?? null;

    return {
      ...tracker,
      keyword_analytics: latestKeywordAnalytics,
      keyword_tracker_results: resultsMap,
    };
  });

  // console.log(transformedData);

  return transformedData;
}

// 예시 데이터:
// [
//   {
//     id: '7831f8eb-9d50-43e7-a718-c1835f6bd243',
//     created_at: '2024-12-09T15:26:50.21625+00:00',
//     keyword_id: 'ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b',
//     active: true,
//     status: 'WAITING',
//     project_id: 'a97699d0-809c-4d7f-bb02-4441637bff87',
//     category_id: '9ae00f8a-e9a5-44ab-af4c-276ac733ddef',
//     keywords: {
//       id: 'ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b',
//       name: '미금역치과',
//       created_at: '2024-12-09T15:24:23.746323+00:00',
//       keyword_analytics: [Array]
//     },
//     keyword_categories: {
//       id: '9ae00f8a-e9a5-44ab-af4c-276ac733ddef',
//       name: '0군',
//       created_at: '2024-12-12T13:07:08.499886+00:00',
//       project_id: 'a97699d0-809c-4d7f-bb02-4441637bff87'
//     },
//     keyword_tracker_results: { '2024-12-10': [Object], '2024-12-11': [Object] },
//     projects: { slug: 'mgsebrance' },
//     keyword_analytics: {
//       id: 'bffd396e-3d0c-4375-be4f-6fafbc6361b5',
//       date: '2024-12-10',
//       created_at: '2024-12-09T15:58:51.467753+00:00',
//       keyword_id: 'ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b',
//       honey_index: 100,
//       daily_search_volume: 100,
//       montly_issue_volume: 200,
//       montly_search_volume: 100
//     }
//   },
//   {
//     id: 'a7eb50f7-538d-48a5-8ad0-275da3aee191',
//     created_at: '2024-12-12T13:09:49.621258+00:00',
//     keyword_id: '0a7e1b7c-9223-4919-b00d-da2ba00db1f8',
//     active: true,
//     status: 'WAITING',
//     project_id: 'a97699d0-809c-4d7f-bb02-4441637bff87',
//     category_id: '9ae00f8a-e9a5-44ab-af4c-276ac733ddef',
//     keywords: {
//       id: '0a7e1b7c-9223-4919-b00d-da2ba00db1f8',
//       name: '미금치과',
//       created_at: '2024-12-12T13:06:47.302449+00:00',
//       keyword_analytics: []
//     },
//     keyword_categories: {
//       id: '9ae00f8a-e9a5-44ab-af4c-276ac733ddef',
//       name: '0군',
//       created_at: '2024-12-12T13:07:08.499886+00:00',
//       project_id: 'a97699d0-809c-4d7f-bb02-4441637bff87'
//     },
//     keyword_tracker_results: {},
//     projects: { slug: 'mgsebrance' },
//     keyword_analytics: null
//   }
// ]