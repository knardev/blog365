import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";
/**
 * Define the query to update a project_blog entry
 * @param projectId - The ID of the project
 * @param blogId - The ID of the blog
 * @param updates - The updates to apply (e.g., active: boolean)
 * @returns The Supabase query object for update
 */
export const defineUpdateProjectsBlogsQuery = (
  projectId: string,
  blogId: string,
  updates: TablesUpdate<"projects_blogs">
) => {
  return createClient()
    .from("projects_blogs")
    .update(updates)
    .match({
      project_id: projectId,
      blog_id: blogId,
    })
    .select();
};

export type UpdateProjectsBlogs = QueryData<
  ReturnType<typeof defineUpdateProjectsBlogsQuery>
>;

// Example Usage:
// const result = await defineUpdateProjectsBlogsQuery("project-id", "blog-id", { active: false });
// console.log(result);
