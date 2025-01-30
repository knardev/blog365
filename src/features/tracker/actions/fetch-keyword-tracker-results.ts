"use server";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
// queries
import {
  defineFetchKeywordAnalyticsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-analytics";
import {
  defineFetchKeywordTrackerResultsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-result";
import { defineFetchKeywordTrackerWithCategoriesQuery } from "@/features/tracker/queries/define-fetch-keyword-tracker-with-catgory";
// types
import { MergedDataRow } from "../types/types";

export const fetchKeywordTrackerWithResults = cache(async ({
  projectSlug,
  offset = 0,
  limit = 50,
  fetchAll = false,
  serviceRole = false,
}: {
  projectSlug: string;
  offset?: number;
  limit?: number;
  fetchAll?: boolean;
  serviceRole?: boolean;
}): Promise<{
  data: MergedDataRow[];
}> => {
  const supabase = createClient(serviceRole);

  // 1) 프로젝트 ID 조회
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

  // 2) 키워드 트래커 목록 가져오기 (+ pagination)
  if (fetchAll) {
    offset = 0;
    limit = 200;
  }
  const range = { offset, limit };
  const trackerQuery = defineFetchKeywordTrackerWithCategoriesQuery(
    projectId,
    serviceRole,
    range,
  );
  const { data: trackersData, error: trackersError } = await trackerQuery;
  if (trackersError || !trackersData) {
    console.error("Error fetching trackers:", trackersError);
    return { data: [] };
  }

  const mergedData: MergedDataRow[] = [];

  for (const tracker of trackersData) {
    // (1) 최신 키워드 분석 가져오기
    let latestAnalytics = null;
    const keywordId = tracker.keywords?.id;
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

    // (2) 날짜별 키워드 추적 결과 가져오기
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

  return { data: mergedData };
});
