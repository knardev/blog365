"use server";

import { createClient } from "@/utils/supabase/server";
import {
  defineFetchMessageTargetsQuery,
  FetchMessageTarget,
} from "@/features/kakao/queries/define-fetch-message-target";

/**
 * Action to fetch message targets for a project
 * @param projectSlug - The slug of the project
 * @returns The list of message targets or an error if it occurs
 */
export async function fetchMessageTargets(
  projectSlug: string,
): Promise<FetchMessageTarget | null> {
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

    // Execute the query to fetch message targets
    const { data, error } = await defineFetchMessageTargetsQuery(projectId);

    if (error) {
      console.error("Error fetching message targets:", error);
      throw new Error("Failed to fetch message targets");
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in fetchMessageTargets:", err);
    throw new Error(
      "Unexpected error occurred while fetching message targets",
    );
  }
}
