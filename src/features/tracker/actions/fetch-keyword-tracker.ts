"use server";

import { defineFetchSingleKeywordTrackerQuery } from "@/features/tracker/queries/define-fetch-single-keyword-tracker";
import { KeywordTracker } from "@/features/tracker/queries/define-fetch-single-keyword-tracker";

/**
 * Action to fetch keyword trackers and transform the data
 * @param trackerId - The slug of the project to fetch keyword trackers for
 * @params projectId - The id of the project to fetch keyword trackers for
 * @returns Transformed keyword trackers without keyword_tracker_results
 */

export async function fetchKeywordTrackerById(
  projectId: string,
  trackerId: string,
): Promise<KeywordTracker> {
  // Step 1: Define the query to fetch keyword trackers
  const query = await defineFetchSingleKeywordTrackerQuery(
    projectId,
    trackerId,
  );

  const { data, error } = query;

  if (error) {
    console.error("Error fetching keyword trackers:", error);
    throw new Error("Failed to fetch keyword trackers");
  }

  return data;
}
