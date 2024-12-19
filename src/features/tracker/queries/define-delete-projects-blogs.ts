import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to delete a project_blog entry
 * @param projectId - The ID of the project
 * @param blogId - The ID of the blog
 * @returns The Supabase query object for deletion
 */
export const defineDeleteProjectsBlogsQuery = (
  projectId: string,
  blogId: string
) => {
  return createClient()
    .from("projects_blogs")
    .delete()
    .match({
      project_id: projectId,
      blog_id: blogId,
    })
    .select();
};

export type DeleteProjectsBlogs = QueryData<
  ReturnType<typeof defineDeleteProjectsBlogsQuery>
>;

// Example Usage:
// const result = await defineDeleteProjectsBlogsQuery("project-id", "blog-id");
// console.log(result);
