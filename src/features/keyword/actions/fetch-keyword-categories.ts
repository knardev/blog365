"use server";

import { createClient } from "@/utils/supabase/server";
import { defineFetchKeywordCategories } from "../queries/define-fetch-keyword-categories";
import { KeywordCategories } from "../queries/define-fetch-keyword-categories";
/**
 * Action to fetch all keywords
 * @param projectSlug - The slug of the project to fetch keywords for
 * @returns Array of keywords or an error if it occurs
 */
export async function fetchKeywordCategories(projectSlug: string): Promise<
  KeywordCategories[] | null
> {
  // Fetch keywords using defineFetchKeywords

    const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    throw new Error("Failed to fetch project by slug");
  }

  const projectId = projectData?.id;

  if (!projectId) {
    throw new Error("Project not found");
  }

  const query = defineFetchKeywordCategories(projectId);
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching keywords:", error);
    throw new Error("Failed to fetch keywords");
  }

  return data;
}
