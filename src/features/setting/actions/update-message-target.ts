"use server";

import { createClient } from "@/utils/supabase/server";
import {
  defineUpdateMessageTargetQuery,
  UpdateMessageTarget,
} from "@/features/setting/queries/define-update-message-target";
import { revalidatePath } from "next/cache";
import { TablesUpdate } from "@/types/database.types";

/**
 * Action to update a message target
 * @param projectSlug - The slug of the project
 * @param phoneNumber - The phone number of the target to update
 * @param updates - The fields to update
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the update or an error if it occurs
 */
export async function updateMessageTarget(
  projectSlug: string,
  phoneNumber: string,
  updates: TablesUpdate<"message_targets">,
  revalidateTargetPath?: string,
): Promise<UpdateMessageTarget | null> {
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

    console.log("Updating message target:", {
      projectSlug,
      phoneNumber,
      updates,
    });

    // Execute the query to update a message target
    const { data, error } = await defineUpdateMessageTargetQuery(
      projectId,
      phoneNumber,
      updates,
    );

    if (error) {
      console.error("Error updating message target:", error);
      throw new Error("Failed to update message target");
    }

    // Revalidate the path if specified
    if (revalidateTargetPath) {
      revalidatePath(revalidateTargetPath);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in updateMessageTarget:", err);
    throw new Error(
      "Unexpected error occurred while updating message target",
    );
  }
}
