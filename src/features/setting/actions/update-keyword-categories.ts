"use server";

import { createClient } from "@/utils/supabase/server";
import {
  defineUpdateKeywordCategoryQuery,
  UpdateKeywordCategory,
} from "@/features/setting/queries/define-update-keyword-categories";
import { revalidatePath } from "next/cache";

/**
 * Action to update a keyword category
 * @param projectSlug - The slug of the project
 * @param categoryId - The ID of the category to update
 * @param updates - Fields to update (e.g., name)
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the update or an error if it occurs
 */
export async function updateKeywordCategory(
  projectSlug: string,
  categoryId: string,
  updates: Partial<{ name: string }>,
  revalidateTargetPath?: string,
): Promise<UpdateKeywordCategory | null> {
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

    // Execute the query to update a keyword category
    const { data, error } = await defineUpdateKeywordCategoryQuery(
      projectId,
      categoryId,
      updates,
    );

    if (error) {
      console.error("Error updating keyword category:", error);
      throw new Error("Failed to update keyword category");
    }

    // Revalidate the path if specified
    if (revalidateTargetPath) {
      revalidatePath(revalidateTargetPath);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in updateKeywordCategory:", err);
    throw new Error(
      "Unexpected error occurred while updating keyword category",
    );
  }
}
