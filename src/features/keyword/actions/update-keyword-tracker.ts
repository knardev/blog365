"use server";

import { defineUpdateKeywordQuery } from "../queries/define-update-keyword";
import { TablesUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

/**
 * Action to update a keyword tracker
 * @param trackerId - The ID of the keyword tracker to update
 * @param updates - The updates to apply (e.g., active: boolean, category_id: string)
 * @param revalidateTargetPath - (Optional) The path to revalidate after updating the tracker
 * @returns The updated tracker data or throws an error if the update fails
 */
export async function updateKeywordTracker(
  trackerId: string,
  updates: TablesUpdate<"keyword_trackers">,
  revalidateTargetPath?: string
) {
  const { data, error } = await defineUpdateKeywordQuery(trackerId, updates);

  if (error) {
    console.error("Error updating keyword tracker:", error);
    throw new Error("Failed to update keyword tracker");
  }

  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  console.log("Keyword tracker updated successfully:", data);

  return data;
}