"use server";

import { createClient } from "@/utils/supabase/server";
import { defineFetchKeywordTrackerQuery } from "../queries/define-fetch-keyword-trackers";
import { KeywordTrackerWithAnalytics } from "../types/types";

/**
 * Action to fetch keyword trackers and transform the data
 * @param projectSlug - The slug of the project to fetch keyword trackers for
 * @returns Transformed keyword trackers without keyword_tracker_results
 */

export async function fetchKeywordTrackers(
  projectSlug: string
): Promise<KeywordTrackerWithAnalytics[] | null> {
  // Step 1: Fetch the project ID based on the slug
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    throw new Error("Failed to fetch project by slug");
  }

  const projectId = projectData?.id;

  if (!projectId) {
    throw new Error("Project not found");
  }

  // Step 2: Fetch keyword trackers
  const query = await defineFetchKeywordTrackerQuery(projectId);

  const { data, error } = query;

  if (error) {
    console.error("Error fetching keyword trackers:", error);
    throw new Error("Failed to fetch keyword trackers");
  }

  // Step 3: Transform data into KeywordTrackerWithResults[]
  const transformedData: KeywordTrackerWithAnalytics[] = data.map((tracker) => {
    // Filter keyword_analytics to retain only the most recent entry
    const latestKeywordAnalytics =
      tracker.keywords?.keyword_analytics?.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] ?? null;

    return {
      ...tracker,
      keyword_analytics: latestKeywordAnalytics,
    };
  });

  return transformedData;
}
