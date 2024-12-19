"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddProjectQuery } from "../queries/define-add-project";
import { revalidatePath } from "next/cache";

/**
 * Action to create a new project
 * @param profileId - The ID of the profile to associate the project with
 * @param projectName - The name of the project
 * @param projectSlug - A unique slug for the project
 * @param revalidateTargetPath - (Optional) The path to revalidate after adding the project
 * @returns The result of the addition or an error if it occurs
 */
export async function addProject({
  profileId,
  projectName,
  projectSlug,
  revalidateTargetPath,
}: {
  profileId: string;
  projectName: string;
  projectSlug: string;
  revalidateTargetPath?: string;
}): Promise<void> {
  // Ensure that the slug is unique
  const { data: existingProject, error: fetchError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking project slug uniqueness:", fetchError);
    throw new Error("Failed to check project slug uniqueness");
  }

  if (existingProject) {
    throw new Error("The project slug is already in use. Please choose another.");
  }

  // Add the project
  const { data, error } = await defineAddProjectQuery(
    profileId,
    projectName,
    projectSlug
  );

  if (error) {
    console.error("Error adding project:", error);
    throw new Error("Failed to add project");
  }

  // Revalidate the target path if provided
  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  console.log("Project added successfully:", data);
}
