// src/features/projects/queries/define-fetch-project-by-slug.ts
import { createClient } from "@/utils/supabase/server";
import { QueryData } from "@supabase/supabase-js";

/**
 * Define the query to fetch a project by slug
 * @param projectSlug - The slug of the project to fetch
 * @param serviceRole - Whether to use the service role
 * @returns Supabase query result
 */
export async function defineFetchProjectBySlugQuery(
  projectSlug: string,
  serviceRole: boolean = false,
) {
  return createClient(serviceRole)
    .from("projects")
    .select("*")
    .eq("slug", projectSlug)
    .eq("delete_state", false)
    .single(); // 단일 결과
}

export type FetchProjectBySlug = QueryData<
  ReturnType<typeof defineFetchProjectBySlugQuery>
>;
