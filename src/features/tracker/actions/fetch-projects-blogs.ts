"use server";

import { createClient } from "@/utils/supabase/server";
import { defineFetchProjectsBlogsQuery } from "../queries/define-fetch-projects-blogs";
// import { ProjectBlogWithDetails } from "../types/types";
import { ProjectsBlogsWithDetail } from "../queries/define-fetch-projects-blogs";

/**
 * Fetch projects_blogs data and transform it for usage
 * @param projectSlug - The slug of the project to fetch blogs for
 * @returns Transformed projects_blogs data or null if no data is found
 */

export async function fetchProjectsBlogs(
  projectSlug: string
): Promise<ProjectsBlogsWithDetail[] | null> {
// ): Promise<ProjectBlogWithDetails[] | null> {
  // Fetch the project ID using the provided slug
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    return null;
  }

  const projectId = projectData?.id;

  // Fetch projects_blogs data
  const query = await defineFetchProjectsBlogsQuery(projectId);
  const { data, error } = query;

  if (error) {
    console.error("Error fetching projects_blogs data:", error);
    throw new Error("Failed to fetch projects_blogs data");
  }

//   // Transform data if needed
//   const transformedData: ProjectBlogWithDetails[] = data.map((projectBlog) => ({
//     ...projectBlog,
//     isActive: projectBlog.active, // Example transformation
//     projectName: projectBlog.projects?.name ?? "Unnamed Project",
//     blogName: projectBlog.blogs?.name ?? "Unnamed Blog",
//   }));

  return data;
}

// 예시 데이터:
// [
//   {
//     id: "projects-blog-1",
//     project_id: "project-123",
//     blog_id: "blog-456",
//     active: true,
//     created_at: "2024-12-15T12:00:00Z",
//     projects: {
//       id: "project-123",
//       name: "Example Project",
//       slug: "example-project",
//       created_at: "2024-01-01T00:00:00Z"
//     },
//     blogs: {
//       id: "blog-456",
//       name: "Example Blog",
//       slug: "example-blog",
//       owner_profile_id: "profile-789",
//       created_at: "2024-01-10T00:00:00Z"
//     },
//     isActive: true,
//     projectName: "Example Project",
//     blogName: "Example Blog"
//   },
//   // Additional projects_blogs entries...
// ]
