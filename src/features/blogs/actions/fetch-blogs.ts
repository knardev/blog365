"use server";

import { defineFetchBlogs } from "../queries/define-fetch-blogs";
import { Blog } from "../types/types";

/**
 * Action to fetch blogs
 * @param profileId - The ID of the profile to fetch blogs for
 * @returns Transformed blogs with analytics
 */

export async function fetchBlog(
  profileId: string,
): Promise<Blog[]> {
  // Fetch blogs and analytics
  const query = await defineFetchBlogs(profileId);

  const { data, error } = query;

  if (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }

  return data;
}
