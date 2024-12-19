"use server";

import { createClient } from "@/utils/supabase/server";
import { defineDeleteProjectsBlogsQuery } from "../queries/define-delete-projects-blogs";
import { revalidatePath } from "next/cache";

/**
 * Action to delete a blog from a project
 * @param projectSlug - The slug of the project
 * @param blogId - The ID of the blog to delete
 * @param revalidateTargetPath - (Optional) The path to revalidate after deletion
 * @returns The result of the deletion or an error if it occurs
 */

export async function deleteProjectsBlogs(
  projectSlug: string,
  blogId: string,
  revalidateTargetPath?: string
): Promise<null> {
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

  // Delete the blog from the project using defineDeleteProjectsBlogsQuery
  const { error: deleteError } = await defineDeleteProjectsBlogsQuery(
    projectId,
    blogId
  );

  if (deleteError) {
    console.error("Error deleting blog from project:", deleteError);
    throw new Error("Failed to delete blog from project");
  }

  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  return null;
}
