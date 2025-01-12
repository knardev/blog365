"use server";

import { defineUpdateProjectQuery } from "../queries/define-update-project";
import { TablesUpdate } from "@/types/database.types";

/**
 * Action to update a project's details
 * @param projectId - The ID of the project to update
 * @param updates - The updates to apply (e.g., name: string)
 * @returns The result of the update or an error if it occurs
 */
export async function updateProject(
  projectId: string,
  updates: TablesUpdate<"projects">,
): Promise<void> {
  // Update the project using defineUpdateProjectQuery
  const { error: updateError } = await defineUpdateProjectQuery(
    projectId,
    updates,
  );

  if (updateError) {
    console.error("Error updating project:", updateError);
    throw new Error("Failed to update project");
  }

  // Optionally revalidate the path if provided
  // if (revalidateTargetPath) {
  //   revalidatePath("/(dashboard)", "layout");
  // }
}
