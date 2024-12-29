import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch message_targets with their details
 * @param projectId - The ID of the project to fetch blogs for
 * @returns The Supabase query object
 */

export const defineFetchMessageTargetsQuery = (projectId: string) => {
  return createClient()
    .from("message_targets")
    .select(`
      *
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
};

// 타입 추론 적용
export type FetchMessageTarget = QueryData<
  ReturnType<typeof defineFetchMessageTargetsQuery>
>;
