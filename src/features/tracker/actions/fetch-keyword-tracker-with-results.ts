// "use server";

import {
  DailyResult,
  KeywordTrackerTransformed,
  KeywordTrackerWithResults,
  KeywordTrackerWithResultsResponse,
  MergedDataRow,
} from "../types/types";
import { createClient } from "@/utils/supabase/server";
import {
  defineFetchKeywordAnalyticsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-analytics";
import {
  defineFetchKeywordTrackerResultsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-result";
import {
  defineFetchKeywordTrackerWithCategoriesQuery,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-with-catgory";
import { subDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export async function fetchKeywordTrackerWithResults(
  projectSlug: string,
  startDate?: string,
  endDate?: string,
): Promise<KeywordTrackerWithResultsResponse | null> {
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError || !projectData) {
    console.error("Error fetching project by slug:", projectError);
    return null;
  }

  const projectId = projectData.id;

  // 1) 키워드 트래커 목록 가져오기
  const trackerQuery = await defineFetchKeywordTrackerWithCategoriesQuery(
    projectId,
  );
  const { data: trackersData, error: trackersError } = trackerQuery;

  if (trackersError) {
    console.error("Error fetching trackers:", trackersError);
    return null;
  }
  if (!trackersData || trackersData.length === 0) {
    return {
      keyword_trackers: [],
      potential_exposure: 0,
      today_catch_count: 0,
      week_catch_count: 0,
    };
  }

  const mergedData: MergedDataRow[] = [];

  for (const tracker of trackersData) {
    // (1) 최신 키워드 분석 가져오기
    const keywordId = tracker.keywords?.id;
    let latestAnalytics = null;
    if (keywordId) {
      const analyticsQuery = await defineFetchKeywordAnalyticsQuery(keywordId);
      const { data: analyticsArray, error: analyticsError } = analyticsQuery;
      if (analyticsError) {
        console.error("Error fetching analytics:", analyticsError);
      }
      latestAnalytics = analyticsArray?.[0] ?? null;
    }

    // (2) 키워드 추적 결과 가져오기
    const resultsQuery = await defineFetchKeywordTrackerResultsQuery(
      tracker.id,
      startDate,
      endDate,
    );
    const { data: resultsArray, error: resultsError } = resultsQuery;
    if (resultsError) {
      console.error("Error fetching results:", resultsError);
    }

    // (3) 병합 데이터에 추가
    mergedData.push({
      ...tracker,
      keyword_analytics: latestAnalytics ?? {
        id: "",
        date: "",
        created_at: "",
        keyword_id: "",
        honey_index: null,
        daily_issue_volume: 0,
        daily_search_volume: 0,
        montly_issue_volume: 0,
        montly_search_volume: 0,
        daily_pc_search_volume: 0,
        montly_pc_search_volume: 0,
        daily_mobile_search_volume: 0,
        montly_mobile_search_volume: 0,
      },
      raw_results: resultsArray ?? [],
    });
  }

  // 2) transformedData 생성
  const KST = "Asia/Seoul";
  // 현재 UTC 기준 시간을 한국시간으로 변환
  const nowInKST = toZonedTime(new Date(), KST);

  // 한국시간 기준 오늘 날짜
  const today = formatInTimeZone(nowInKST, KST, "yyyy-MM-dd");

  // 한국시간 기준 어제 날짜
  const yesterdayDateInKST = subDays(nowInKST, 1);
  const yesterday = formatInTimeZone(yesterdayDateInKST, KST, "yyyy-MM-dd");

  // 어제 기준 7일 전 날짜
  const weekAgoDateInKST = subDays(yesterdayDateInKST, 7);
  const weekAgo = formatInTimeZone(weekAgoDateInKST, KST, "yyyy-MM-dd");

  const transformedData: KeywordTrackerTransformed[] = mergedData.map(
    (tracker) => {
      const resultsMap: Record<string, DailyResult> = {};

      // 날짜별 결과 매핑
      tracker.raw_results.forEach((result) => {
        const date = result.date;
        if (!resultsMap[date]) {
          resultsMap[date] = { catch_success: 0, catch_result: [] };
        }

        // 성공 여부 계산
        if (
          result.smart_block_name?.includes("인기글") &&
          result.rank_in_smart_block !== null &&
          result.rank_in_smart_block <= 7
        ) {
          resultsMap[date].catch_success += 1;
        } else if (
          result.rank_in_smart_block !== null &&
          result.rank_in_smart_block <= 3
        ) {
          resultsMap[date].catch_success += 1;
        }

        resultsMap[date].catch_result.push({
          post_url: result.post_url ?? "N/A",
          smart_block_name: result.smart_block_name ?? "N/A",
          rank_in_smart_block: result.rank_in_smart_block ?? -1,
        });

        // 정렬
        resultsMap[date].catch_result.sort(
          (a, b) => a.rank_in_smart_block - b.rank_in_smart_block,
        );
      });

      // 오늘 날짜의 일간 첫페이지 노출량 계산
      const todayResult = resultsMap[yesterday];
      const dailyFirstPageExposure = (todayResult?.catch_success ?? 0) *
        (tracker.keyword_analytics.daily_search_volume ?? 0);

      return {
        ...tracker,
        keyword_tracker_results: resultsMap,
        keyword_analytics: {
          ...tracker.keyword_analytics,
          daily_first_page_exposure: dailyFirstPageExposure,
        },
      };
    },
  );

  // 3) 잠재노출량 및 키워드 잡힌 개수 계산
  const potentialExposure = transformedData.reduce((total, tracker) => {
    return (
      total + (tracker.keyword_analytics.daily_first_page_exposure ?? 0)
    );
  }, 0) * 0.2;

  const todayCatchCount = transformedData.filter((tracker) => {
    const todayResult = tracker.keyword_tracker_results[yesterday];
    return todayResult?.catch_success ?? 0 > 0;
  }).length;

  const weekCatchCount = transformedData.filter((tracker) => {
    const weekAgoResult = tracker.keyword_tracker_results[weekAgo];
    return weekAgoResult?.catch_success ?? 0 > 0;
  }).length;

  // 4) 최종 결과 반환
  return {
    keyword_trackers: transformedData,
    potential_exposure: potentialExposure,
    today_catch_count: todayCatchCount,
    week_catch_count: weekCatchCount,
  };
}

// {
//   "data": [
//     {
//       "id": "7831f8eb-9d50-43e7-a718-c1835f6bd243",
//       "created_at": "2024-12-09T15:26:50.21625+00:00",
//       "keyword_id": "ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b",
//       "active": true,
//       "status": "WAITING",
//       "project_id": "a97699d0-809c-4d7f-bb02-4441637bff87",
//       "category_id": "9ae00f8a-e9a5-44ab-af4c-276ac733ddef",
//       "keywords": {
//         "id": "ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b",
//         "name": "미금역치과",
//         "created_at": "2024-12-09T15:24:23.746323+00:00"
//       },
//       "keyword_categories": {
//         "id": "9ae00f8a-e9a5-44ab-af4c-276ac733ddef",
//         "name": "0군",
//         "created_at": "2024-12-12T13:07:08.499886+00:00",
//         "project_id": "a97699d0-809c-4d7f-bb02-4441637bff87"
//       },
//       "keyword_tracker_results": {
//         "2024-12-10": {
//           "catch_success": 3,
//           "catch_result": [
//             {
//               "post_url": "https://example.com/post1",
//               "smart_block_name": "인기글",
//               "rank_in_smart_block": 1
//             },
//             {
//               "post_url": "https://example.com/post2",
//               "smart_block_name": "인기글",
//               "rank_in_smart_block": 2
//             }
//           ]
//         },
//         "2024-12-11": {
//           "catch_success": 2,
//           "catch_result": [
//             {
//               "post_url": "https://example.com/post3",
//               "smart_block_name": "추천글",
//               "rank_in_smart_block": 1
//             }
//           ]
//         }
//       },
//       "keyword_analytics": {
//         "id": "bffd396e-3d0c-4375-be4f-6fafbc6361b5",
//         "date": "2024-12-10",
//         "created_at": "2024-12-09T15:58:51.467753+00:00",
//         "keyword_id": "ea4d9994-3cc5-49cb-8456-8b4ee3ccaa9b",
//         "honey_index": 100,
//         "daily_search_volume": 100,
//         "montly_issue_volume": 200,
//         "montly_search_volume": 100,
//         "daily_first_page_exposure": 300
//       }
//     }
//   ],
//   "potential_exposure": 60
//   "today_catch_count": 1,
//   "week_catch_count": 1
// }
