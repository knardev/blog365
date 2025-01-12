import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to soft delete a tracker
 * @param trackerId - The ID of the tracker to delete
 * @returns Supabase query result
 */
export const defineSoftDeleteTrackerQuery = (trackerId: string) => {
  return createClient()
    .from("keyword_trackers")
    .update({ delete_state: true }) // Soft delete by setting delete_state to true
    .eq("id", trackerId);
};

export type SoftDeleteKeywordTracker = QueryData<
  ReturnType<typeof defineSoftDeleteTrackerQuery>
>;
