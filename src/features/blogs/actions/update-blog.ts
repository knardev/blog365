"use server";

import { createClient } from "@/utils/supabase/server";
import { defineUpdateBlogQuery } from "../queries/define-update-blog";
import { revalidatePath } from "next/cache";
import { TablesUpdate } from "@/types/database.types";

/**
 * Action to update a blog's details
 * @param blogId - The ID of the blog to update
 * @param updates - The updates to apply (e.g., name: string)
 * @param revalidateTargetPath - (Optional) The path to revalidate after updating
 * @returns The result of the update or an error if it occurs
 */
export async function updateBlog(
  blogId: string,
  updates: TablesUpdate<"blogs">,
  revalidateTargetPath?: string,
): Promise<null> {
  // Update the blog using defineUpdateBlogQuery
  const { error: updateError } = await defineUpdateBlogQuery(blogId, updates);

  if (updateError) {
    console.error("Error updating blog:", updateError);
    throw new Error("Failed to update blog");
  }

  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  return null;
}
