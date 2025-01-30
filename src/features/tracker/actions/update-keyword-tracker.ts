"use server";

import { defineUpdateKeywordQuery } from "@/features/tracker/queries/define-update-keyword-tracker";
import { TablesUpdate } from "@/types/database.types";

/**
 * Action to update a keyword tracker
 * @param trackerId - The ID of the keyword tracker to update
 * @param updates - The updates to apply (e.g., active: boolean, category_id: string)
 * @returns The updated tracker data or throws an error if the update fails
 */
export async function updateKeywordTracker(
  trackerId: string,
  updates: TablesUpdate<"keyword_trackers">,
) {
  const { data, error } = await defineUpdateKeywordQuery(trackerId, updates);

  if (error) {
    console.error("Error updating keyword tracker:", error);
    throw new Error("Failed to update keyword tracker");
  }

  console.log("Keyword tracker updated successfully:", data);

  return data;
}
