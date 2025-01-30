// src/features/tracker/actions/soft-delete-tracker.ts
"use server";

import { revalidatePath } from "next/cache";
import { defineSoftDeleteTrackerQuery } from "../queries/define-soft-delete-keyword-tracker";

/**
 * Action to soft delete a tracker
 * @param trackerId - The ID of the tracker to delete
 * @returns Result of the deletion or throws an error
 */
export async function softDeleteTracker(
  trackerId: string,
): Promise<boolean> {
  const { error } = await defineSoftDeleteTrackerQuery(trackerId);

  if (error) {
    console.error("Error soft deleting tracker:", error);
    throw new Error("Failed to soft delete tracker.");
  }

  // Revalidate the cache for the target path
  return true;
}
