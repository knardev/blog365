"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddProjectsBlogsQuery } from "../queries/define-add-projects-blogs";
import { ProjectsBlogsInsert } from "../types/types";
import { revalidatePath } from "next/cache";

/**
 * Action to add a new blog to a project
 * @param projectSlug - The slug of the project
 * @param blogId - The ID of the blog to add
 * @returns The result of the insertion or an error if it occurs
 */
export async function addProjectsBlogs(
  projectSlug: string,
  blogId: string,
  revalidateTargetPath?: string
): Promise<ProjectsBlogsInsert[] | null> {
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

  // Add the blog to the project using defineAddProjectsBlogsQuery
  const { data, error } = await defineAddProjectsBlogsQuery(projectId, blogId);

  if (error) {
    console.error("Error adding blog to project:", error);
    throw new Error("Failed to add blog to project");
  }

  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }
  return data;
}
