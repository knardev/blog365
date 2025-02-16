import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new tracker_result_refresh_transactions entry
 * @param newData - The data to insert
 * @returns The Supabase query object for insertion
 * @example
 * const result = await defineAddTrackerResultRefreshTransactionsQuery({
 *  project_id: "project-id",
 * total_count: 10,
 * });
 * console.log(result);
 */

export const defineAddTrackerResultRefreshTransactionsQuery = (
  newData: {
    project_id: string;
    refresh_date: string;
    total_count: number;
  },
) => {
  return createClient()
    .from("tracker_result_refresh_transactions")
    .insert(newData)
    .select(`*`)
    .single();
};

export type AddTrackerResultRefreshTransaction = QueryData<
  ReturnType<typeof defineAddTrackerResultRefreshTransactionsQuery>
>;

// Example Usage:
// const result = await defineAddKeywordTrackerQuery("project-id", "keyword-id", "category-id");
// console.log(result);
