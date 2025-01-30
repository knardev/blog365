import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new project_blog entry
 * @param projectId - The ID of the project
 * @param blogId - The ID of the blog
 * @returns The Supabase query object for insertion
 */
export const defineAddProjectsBlogsQuery = (
  projectId: string,
  blogId: string,
) => {
  return createClient()
    .from("projects_blogs")
    .insert({
      project_id: projectId,
      blog_id: blogId,
      active: true,
    })
    .select(`
      *,
      projects(
        id,
        name,
        slug,
        created_at
      ),
      blogs(
        id,
        name,
        blog_slug,
        owner_profile_id,
        created_at
      )
    `);
};

export type AddProjectsBlogs = QueryData<
  ReturnType<typeof defineAddProjectsBlogsQuery>
>;

// Example Usage:
// const result = await defineAddProjectsBlogsQuery("project-id", "blog-id");
// console.log(result);
