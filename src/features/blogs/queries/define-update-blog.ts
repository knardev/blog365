import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";

/**
 * Define the query to update a blog entry
 * @param blogId - The ID of the blog
 * @param updates - The updates to apply (e.g., name: string)
 * @returns The Supabase query object for update
 */
export const defineUpdateBlogQuery = (
  blogId: string,
  updates: TablesUpdate<"blogs">,
) => {
  return createClient()
    .from("blogs")
    .update(updates)
    .eq("id", blogId)
    .select();
};

export type UpdateBlog = QueryData<ReturnType<typeof defineUpdateBlogQuery>>;

// Example Usage:
// const result = await defineUpdateBlogQuery("blog-id", { name: "New Blog Name" });
// console.log(result);
