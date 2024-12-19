"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddBlogQuery } from "../queries/define-add-blog";
import { revalidatePath } from "next/cache";

/**
 * Action to create a new blog
 * @param profileId - The ID of the profile to associate the blog with
 * @param blogName - The name of the blog
 * @param blogSlug - A unique slug for the blog
 * @param revalidateTargetPath - (Optional) The path to revalidate after adding the blog
 * @returns The result of the addition or an error if it occurs
 */
export async function addBlog({
  profileId,
  blogName,
  blogSlug,
  revalidateTargetPath,
}: {
  profileId: string;
  blogName: string;
  blogSlug: string;
  revalidateTargetPath?: string;
}): Promise<void> {

  // Ensure that the slug is unique
  const { data: existingBlog, error: fetchError } = await createClient()
    .from("blogs")
    .select("id")
    .eq("blog_slug", blogSlug)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking blog slug uniqueness:", fetchError);
    throw new Error("Failed to check blog slug uniqueness");
  }

  if (existingBlog) {
    throw new Error("The blog slug is already in use. Please choose another.");
  }

  // Add the blog
  const { data, error } = await defineAddBlogQuery(profileId, blogName, blogSlug);

  if (error) {
    console.error("Error adding blog:", error);
    throw new Error("Failed to add blog");
  }

  // Revalidate the target path if provided
  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  console.log("Blog added successfully:", data);
}
