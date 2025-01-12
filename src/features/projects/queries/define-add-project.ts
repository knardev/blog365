import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new project
 * @param profileId - The ID of the profile to associate the project with
 * @param projectName - The name of the project
 * @param projectSlug - A unique slug for the project
 * @returns The Supabase query object for insertion
 */
export const defineAddProjectQuery = (
  profileId: string,
  projectName: string,
  projectSlug: string,
) => {
  return createClient()
    .from("projects")
    .insert({
      owner_profile_id: profileId,
      name: projectName,
      slug: projectSlug,
    })
    .select()
    .single();
};

export type AddProject = QueryData<
  ReturnType<typeof defineAddProjectQuery>
>;
