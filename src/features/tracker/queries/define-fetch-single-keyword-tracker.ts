import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch keyword trackers with their results, including keyword and category details
 * @param trackerId - The id of the project to fetch keyword trackers for
 * @params projectId - The id of the project to fetch keyword trackers for
 * @returns The Supabase query object
 */

export const defineFetchSingleKeywordTrackerQuery = async (
  projectId: string,
  trackerId: string,
) => {
  const query = createClient()
    .from("keyword_trackers")
    .select(`id`)
    .eq("id", trackerId)
    .eq("project_id", projectId)
    .single();

  return query;
};

// Type for the query result
export type KeywordTracker = QueryData<
  ReturnType<typeof defineFetchSingleKeywordTrackerQuery>
>;
