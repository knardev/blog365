"use server";

import { createClient } from "@/utils/supabase/server";
import {
    defineDeleteMessageTargetQuery,
    DeleteMessageTarget,
} from "@/features/kakao/queries/define-delete-message-target";
import { revalidatePath } from "next/cache";

/**
 * Action to delete a message target
 * @param projectSlug - The slug of the project
 * @param phoneNumber - The phone number of the target to delete
 * @param revalidateTargetPath - (Optional) The path to revalidate
 * @returns The result of the deletion or an error if it occurs
 */
export async function deleteMessageTarget(
    projectSlug: string,
    phoneNumber: string,
    revalidateTargetPath?: string,
): Promise<DeleteMessageTarget | null> {
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

        // Execute the query to delete a message target
        const { data, error } = await defineDeleteMessageTargetQuery(
            projectId,
            phoneNumber,
        );

        if (error) {
            console.error("Error deleting message target:", error);
            throw new Error("Failed to delete message target");
        }

        // Revalidate the path if specified
        if (revalidateTargetPath) {
            revalidatePath(revalidateTargetPath);
        }

        return data;
    } catch (err) {
        console.error("Unexpected error in deleteMessageTarget:", err);
        throw new Error(
            "Unexpected error occurred while deleting message target",
        );
    }
}
