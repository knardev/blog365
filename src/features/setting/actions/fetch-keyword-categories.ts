"use server";

import { createClient } from "@/utils/supabase/server";
import { defineFetchKeywordCategoriesQuery } from "@/features/setting/queries/define-fetch-keyword-categories";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
/**
 * Action to fetch all keywords
 * @param projectSlug - The slug of the project to fetch keywords for
 * @param serviceRole - Whether to use the service role
 * @returns Array of keywords or an error if it occurs
 */
export async function fetchKeywordCategories(
  projectSlug: string,
  serviceRole: boolean = false,
): Promise<
  KeywordCategories | null
> {
  // Fetch keywords using defineFetchKeywords

  const { data: projectData, error: projectError } = await createClient(
    serviceRole,
  )
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    return null;
  }

  const projectId = projectData?.id;

  if (!projectId) {
    return null;
  }

  const query = defineFetchKeywordCategoriesQuery(projectId, serviceRole);
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching keywords:", error);
    return null;
  }

  return data;
}
