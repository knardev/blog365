"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddKeyword } from "../queries/define-add-keyword";
import { revalidatePath } from "next/cache";

/**
 * Action to add a new keyword
 * @param name - The name of the keyword to add
 * @param revalidateTargetPath - (Optional) The path to revalidate after insertion
 * @returns The result of the insertion or an error if it occurs
 */
export async function addKeyword(
  name: string,
  revalidateTargetPath?: string
): Promise<{ id: string; name: string; created_at: string }[] | null> {
  // Add the keyword using defineAddKeyword
  const { data, error } = await defineAddKeyword(name);

  if (error) {
    console.error("Error adding keyword:", error);
    throw new Error("Failed to add keyword");
  }

  if (revalidateTargetPath) {
    revalidatePath(revalidateTargetPath);
  }

  return data;
}
