import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export const defineFetchTrackerResultRefreshActiveTransactionQuery = ({
  project_id,
}: {
  project_id: string;
}) => {
  return createClient()
    .from("tracker_result_refresh_transactions")
    .select("*")
    .eq("project_id", project_id)
    .eq("active", true)
    .single();
};

export type FetchTrackerResultRefreshTransaction = QueryData<
  ReturnType<typeof defineFetchTrackerResultRefreshActiveTransactionQuery>
>;

// Example Usage:
// const result = await defineAddKeywordTrackerQuery("project-id", "keyword-id", "category-id");
// console.log(result);
