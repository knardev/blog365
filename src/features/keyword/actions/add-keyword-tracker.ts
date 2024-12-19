"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddKeyword } from "@/features/keyword/queries/define-add-keyword";
import { defineFilterKeyword } from "@/features/keyword/queries/define-filter-keyword";
import { defineAddKeywordTrackerQuery } from "../queries/define-add-keyword-tracker";
import { revalidatePath } from "next/cache";

/**
 * Action to add a keyword tracker
 * @param projectSlug - The slug of the project
 * @param keywordName - The name of the keyword to track
 * @param categoryId - (Optional) The ID of the category to associate with the tracker
 * @param revalidateTargetPath - (Optional) The path to revalidate after adding the tracker
 * @returns The result of the addition or an error if it occurs
 */
export async function addKeywordTracker({
  projectSlug,
  keywordName,
  categoryId,
  revalidateTargetPath,
}: {
  projectSlug: string;
  keywordName: string;
  categoryId?: string;
  revalidateTargetPath?: string;
}): Promise<void> {
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

  // Step 1: Try to filter the keyword by name
  const { data: filteredKeyword, error: filterError } = await defineFilterKeyword(
    keywordName
  );

  if (filterError && filterError.code !== "PGRST116") {
    console.error("Error filtering keyword:", filterError);
    throw new Error("Failed to filter keyword");
  }

  let keywordId = filteredKeyword?.id;

  // Step 2: If the keyword does not exist, add it
  if (!keywordId) {
    const { data: addedKeyword, error: addKeywordError } = await defineAddKeyword(
      keywordName
    );

    if (addKeywordError) {
      console.error("Error adding keyword:", addKeywordError);
      throw new Error("Failed to add keyword");
    }

    keywordId = addedKeyword[0]?.id;
  }

  if (!keywordId) {
    throw new Error("Keyword ID could not be retrieved or added.");
  }

  // Step 3: Add the keyword tracker
  const { data, error: trackerError } = await defineAddKeywordTrackerQuery(
    projectId,
    keywordId,
    categoryId // Undefined if not provided
  );

  if (trackerError) {
    console.error("Error adding keyword tracker:", trackerError);
    throw new Error("Failed to add keyword tracker");
  }

  // Step 4: Revalidate the target path if provided
  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  console.log("Keyword tracker added successfully:", data);
}
