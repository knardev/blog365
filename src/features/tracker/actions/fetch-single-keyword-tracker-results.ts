"use server";

import { cache } from "react";
// queries
import {
  defineFetchKeywordAnalyticsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-analytics";
import {
  defineFetchKeywordTrackerResultsQuery,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-result";
import { defineFetchSingleKeywordTrackerWithCategoriesQuery } from "@/features/tracker/queries/define-fetch-single-keyword-tracker-with-catgory";
// types
import { MergedDataRow } from "../types/types";

export const fetchKeywordTrackerWithResultsById = cache(async ({
  trackerId,
  serviceRole = false,
}: {
  trackerId: string;
  serviceRole?: boolean;
}): Promise<MergedDataRow | null> => {
  const trackerQuery = defineFetchSingleKeywordTrackerWithCategoriesQuery(
    trackerId,
    serviceRole,
  );
  const { data: trackerData, error: trackerError } = await trackerQuery;

  if (trackerError || !trackerData) {
    console.error("Error fetching tracker by ID:", trackerError);
    return null;
  }

  // 3) Fetch the latest keyword analytics for the tracker
  const keywordId = trackerData.keywords?.id;
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

  // 4) Fetch the keyword tracker results by tracker ID
  const resultsQuery = await defineFetchKeywordTrackerResultsQuery(
    trackerId,
    undefined,
    undefined,
    serviceRole,
  );
  const { data: resultsArray, error: resultsError } = resultsQuery;

  if (resultsError) {
    console.error("Error fetching tracker results:", resultsError);
  }

  // 5) Construct and return the merged data row
  return {
    ...trackerData,
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
  };
});
