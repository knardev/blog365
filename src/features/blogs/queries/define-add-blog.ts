import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new blog
 * @param profileId - The ID of the profile to associate the blog with
 * @param blogName - The name of the blog
 * @param blogSlug - A unique slug for the blog
 * @returns The Supabase query object for insertion
 */
export const defineAddBlogQuery = (
  profileId: string,
  blogName: string,
  blogSlug: string
) => {
  return createClient()
    .from("blogs")
    .insert({
      owner_profile_id: profileId,
      name: blogName,
      blog_slug: blogSlug,
    })
    .select();
};

export type AddBlog = QueryData<
  ReturnType<typeof defineAddBlogQuery>
>;

// Example Usage:
// const result = await defineAddBlogQuery("profile-id", "My Blog", "my-blog");
// console.log(result);
