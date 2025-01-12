import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";

/**
 * Define the query to update a project entry
 * @param projectId - The ID of the project
 * @param updates - The updates to apply (e.g., name: string)
 * @returns The Supabase query object for update
 */
export const defineUpdateProjectQuery = (
  projectId: string,
  updates: TablesUpdate<"projects">,
) => {
  return createClient()
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select();
};

export type EditProject = QueryData<
  ReturnType<typeof defineUpdateProjectQuery>
>;
