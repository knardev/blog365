import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to soft delete a project
 * @param projectId - The ID of the project to soft delete
 * @returns The Supabase query object for update operation
 */
export const defineSoftDeleteProjectQuery = (projectId: string) => {
  return createClient()
    .from("projects")
    .update({ delete_state: true })
    .eq("id", projectId);
};

export type SoftDeleteProject = QueryData<
  ReturnType<typeof defineSoftDeleteProjectQuery>
>;
