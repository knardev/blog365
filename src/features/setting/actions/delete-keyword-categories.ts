"use server";

import { createClient } from "@/utils/supabase/server";
import {
  defineDeleteKeywordCategoryQuery,
  DeleteKeywordCategory,
} from "@/features/setting/queries/define-delete-keyword-categories";
import { revalidatePath } from "next/cache";

/**
 * Action to delete a keyword category
 * @param projectSlug - The slug of the project
 * @param categoryId - The ID of the category to delete
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the deletion or an error if it occurs
 */
export async function deleteKeywordCategory(
  projectSlug: string,
  categoryId: string,
  revalidateTargetPath?: string,
): Promise<DeleteKeywordCategory | null> {
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

    // Execute the query to delete a keyword category
    const { data, error } = await defineDeleteKeywordCategoryQuery(
      projectId,
      categoryId,
    );

    if (error) {
      console.error("Error deleting keyword category:", error);
      throw new Error("Failed to delete keyword category");
    }

    // Revalidate the path if specified
    if (revalidateTargetPath) {
      revalidatePath(revalidateTargetPath);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in deleteKeywordCategory:", err);
    throw new Error(
      "Unexpected error occurred while deleting keyword category",
    );
  }
}
