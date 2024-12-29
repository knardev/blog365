"use server";

import { createClient } from "@/utils/supabase/server";
import {
  AddMessageTarget,
  defineAddMessageTargetQuery,
} from "@/features/kakao/queries/define-add-message-target";
import { revalidatePath } from "next/cache";

/**
 * Action to add a new message target
 * @param projectSlug - The slug of the project
 * @param phoneNumber - The phone number of the target
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the insertion or an error if it occurs
 */
export async function addMessageTarget(
  projectSlug: string,
  phoneNumber: string,
  revalidateTargetPath?: string,
): Promise<AddMessageTarget | null> {
  try {
    // Fetch the project ID using the provided slug
    const { data: projectData, error: projectError } = await createClient()
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();

    if (projectError) {
      console.error("Error fetching project by slug:", projectError);
      throw new Error("Failed to fetch project by slug");
    }

    const projectId = projectData?.id;

    if (!projectId) {
      throw new Error("Project not found");
    }

    // Execute the query to add a message target
    const { data, error } = await defineAddMessageTargetQuery(
      projectId,
      phoneNumber,
    );

    if (error) {
      console.error("Error adding message target:", error);
      throw new Error("Failed to add message target");
    }

    // Revalidate the path if specified
    if (revalidateTargetPath) {
      revalidatePath(revalidateTargetPath);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in addMessageTarget:", err);
    throw new Error(
      "Unexpected error occurred while adding message target",
    );
  }
}
