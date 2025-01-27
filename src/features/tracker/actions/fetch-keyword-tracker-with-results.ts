"use server";
// utils
import { cache } from "react";
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";
import { createClient } from "@/utils/supabase/server";
// quries
import {
  defineFetchKeywordAnalyticsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-analytics";
import {
  defineFetchKeywordTrackerResultsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-result";
import { defineFetchKeywordTrackerWithCategoriesQuery } from "@/features/tracker/queries/define-fetch-keyword-tracker-with-catgory";
// types
import {
  DailyResult,
  KeywordTrackerTransformed,
  KeywordTrackerWithResultsResponse,
  MergedDataRow,
} from "../types/types";

/**
 * 무한 스크롤용 서버 액션
 * @param projectSlug   - 프로젝트 slug
 * @param offset        - 페이지네이션 offset
 * @param limit         - 페이지네이션 limit
 * @param startDate     - 시작 날짜
 * @param endDate       - 끝 날짜
 * @param fetchAll      - 전체 데이터 가져오기 여부
 * @param strictMode    - strict 모드 여부
 * @param serviceRole   - service role 사용 여부
 * @returns { data, totalCount }
 *    data: KeywordTrackerTransformed[] (가져온 subset)
 *    totalCount: number (전체 트래커 개수)
 */
export const fetchKeywordTrackerWithResults = cache(async (
  {
    projectSlug,
    offset = 0,
    limit = 50,
    startDate,
    endDate,
    fetchAll = false,
    strictMode = false,
    serviceRole = false,
  }: {
    projectSlug: string;
    offset?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    fetchAll?: boolean;
    strictMode?: boolean;
    serviceRole?: boolean;
  },
): Promise<{
  data: KeywordTrackerTransformed[];
  potentialExposureByDate?: Record<string, number>;
  catchCountByDate?: Record<string, number>;
}> => {
  // Create Supabase client (use service role if specified)
  const supabase = createClient(serviceRole);

  // 0) 프로젝트 ID 조회
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError || !projectData) {
    console.error("Error fetching project by slug:", projectError);
    return { data: [] };
  }
  const projectId = projectData.id;

  // 2) 실제 키워드 트래커 데이터 가져오기 + offset/limit 적용
  //    정렬(sorting)이 있다면, 예: 첫 번째 정렬 조건만 사용 or 여러 조건
  // 페이지네이션 범위 설정
  if (fetchAll) {
    offset = 0;
    limit = 200;
  }
  const range = {
    offset,
    limit,
  };

  // 키워드 트래커 데이터 가져오기
  const trackerQuery = defineFetchKeywordTrackerWithCategoriesQuery(
    projectId,
    serviceRole,
    range,
  );

  const { data: trackersData, error: trackersError } = await trackerQuery;

  if (trackersError || !trackersData) {
    console.error("Error fetching trackers:", trackersError);
    return {
      data: [],
    };
  }

  const mergedData: MergedDataRow[] = [];

  for (const tracker of trackersData) {
    // (1) 최신 키워드 분석 가져오기
    const keywordId = tracker.keywords?.id;
    let latestAnalytics = null;
    if (keywordId) {
      const analyticsQuery = await defineFetchKeywordAnalyticsQuery(
        keywordId,
        serviceRole,
      );
      const { data: analyticsArray, error: analyticsError } = analyticsQuery;
      if (analyticsError) {
        console.error("Error fetching analytics:", analyticsError);
      }
      latestAnalytics = analyticsArray?.[0] ?? null;
    }

    // (2) 키워드 추적 결과 가져오기
    const resultsQuery = await defineFetchKeywordTrackerResultsQuery(
      tracker.id,
      undefined,
      undefined,
      serviceRole,
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
  // strictMode에 따라 인기글/일반글의 최대 rank 결정
  const maxRankPopular = strictMode ? 2 : 7;
  const maxRankNormal = strictMode ? 2 : 3;

  // 2) transformedData 생성
  const today = getTodayInKST();

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
        if (result.smart_block_name?.includes("인기글")) {
          if (
            result.rank_in_smart_block !== null &&
            result.rank_in_smart_block <= maxRankPopular
          ) {
            resultsMap[date].catch_success += 1;
          }
        } else {
          if (
            result.rank_in_smart_block !== null &&
            result.rank_in_smart_block <= maxRankNormal
          ) {
            resultsMap[date].catch_success += 1;
          }
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
      const todayResult = resultsMap[today];
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

  if (!fetchAll) {
    return {
      data: transformedData,
    };
  }

  const potentialExposureByDate: Record<string, number> = {};
  const catchCountByDate: Record<string, number> = {};

  // 날짜별 `potentialExposure` 및 `catchCount` 계산
  transformedData.forEach((tracker) => {
    Object.keys(tracker.keyword_tracker_results).forEach((date) => {
      const result = tracker.keyword_tracker_results[date];
      const dailyExposure = (result?.catch_success ?? 0) *
        (tracker.keyword_analytics.daily_search_volume ?? 0);

      potentialExposureByDate[date] = (potentialExposureByDate[date] ?? 0) +
        dailyExposure;
      if ((result?.catch_success ?? 0) > 0) {
        catchCountByDate[date] = (catchCountByDate[date] ?? 0) + 1;
      }
    });
  });

  // 4) 최종 결과 반환
  return {
    data: transformedData,
    potentialExposureByDate,
    catchCountByDate,
  };
});

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
//   "potentialExposureByDate": {
//     "2024-12-10": 200,
//     "2024-12-11": 100
//   },
//   "catchCountByDate": {
//     "2024-12-10": 1,
//     "2024-12-11": 1
//   }
// }
