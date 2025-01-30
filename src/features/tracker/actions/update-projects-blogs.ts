"use server";

import { createClient } from "@/utils/supabase/server";
import { defineUpdateProjectsBlogsQuery } from "../queries/define-update-projects-blogs";
import { revalidatePath } from "next/cache";
import { TablesUpdate } from "@/types/database.types";

/**
 * Action to update a project_blog entry
 * @param projectSlug - The slug of the project
 * @param blogId - The ID of the blog to update
 * @param updates - The updates to apply (e.g., active: boolean)
 * @returns The result of the update or an error if it occurs
 */
export async function updateProjectsBlogs(
  projectSlug: string,
  blogId: string,
  updates: TablesUpdate<"projects_blogs">,
): Promise<boolean> {
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

  // Update the blog in the project using defineUpdateProjectsBlogsQuery
  const { error: updateError } = await defineUpdateProjectsBlogsQuery(
    projectId,
    blogId,
    updates,
  );

  if (updateError) {
    console.error("Error updating blog in project:", updateError);
    throw new Error("Failed to update blog in project");
  }

  // revalidatePath("/(dashboard)/[project_slug]/tracker");

  return true;
}
