import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";

/**
 * Define the query to update a keyword_tracker entry
 * @param trackerId - The ID of the keyword tracker
 * @param updates - The updates to apply (e.g., category_id: string)
 * @returns The Supabase query object for update
 */
export const defineUpdateKeywordQuery = (
  trackerId: string,
  updates: TablesUpdate<"keyword_trackers">
) => {
  return createClient()
    .from("keyword_trackers")
    .update(updates)
    .match({ id: trackerId })
    .select();
};

export type UpdateKeywordTracker = QueryData<
  ReturnType<typeof defineUpdateKeywordQuery>
>;

// Example Usage:
// const result = await defineUpdateKeywordQuery("tracker-id", { category_id: "new-category-id" });
// console.log(result);
