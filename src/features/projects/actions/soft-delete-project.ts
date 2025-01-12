"use server";

import { defineSoftDeleteProjectQuery } from "../queries/define-soft-delete-project";

/**
 * Action to delete a project
 * @param projectId - The ID of the project to delete
 * @returns void or throws an error if the deletion fails
 */
export async function softDeleteProject(projectId: string): Promise<void> {
  const { error: deleteError } = await defineSoftDeleteProjectQuery(projectId);

  if (deleteError) {
    console.error("Error deleting project:", deleteError);
    throw new Error(`Failed to delete project with ID ${projectId}`);
  }

  console.log(`Project with ID ${projectId} deleted successfully.`);
}
