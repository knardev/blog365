import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch a project
 * @param  - The ID of profile to fetch the project for
 * @returns Supabase query to fetch the project
 */
export const defineFetchProjectQuery = async (profileId: string) => {
  const query = createClient()
    .from("projects")
    .select("*")
    .eq("owner_profile_id", profileId);

  return query;
};

// Type for the query result
export type FetchProject = QueryData<
  ReturnType<typeof defineFetchProjectQuery>
>;
