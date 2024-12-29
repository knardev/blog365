"use server";

import { createClient } from "@/utils/supabase/server";
import {
  AddKeywordCategory,
  defineAddKeywordCategoryQuery,
} from "@/features/setting/queries/define-add-keyword-categories";
import { revalidatePath } from "next/cache";

/**
 * Action to add a new keyword category
 * @param projectSlug - The slug of the project
 * @param name - The name of the keyword category
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the insertion or an error if it occurs
 */
export async function addKeywordCategory(
  projectSlug: string,
  name: string,
  revalidateTargetPath?: string,
): Promise<AddKeywordCategory | null> {
  try {
    // Fetch the project ID using the provided slug
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

    // Execute the query to add a keyword category
    const { data, error } = await defineAddKeywordCategoryQuery(
      projectId,
      name,
    );

    if (error) {
      console.error("Error adding keyword category:", error);
      throw new Error("Failed to add keyword category");
    }

    // Revalidate the path if specified
    if (revalidateTargetPath) {
      revalidatePath(revalidateTargetPath);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in addKeywordCategory:", err);
    throw new Error("Unexpected error occurred while adding keyword category");
  }
}
