"use server";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetch the total count of active keyword trackers
 * @returns The total count of active keyword trackers
 */
export async function fetchTotalCount(
  { serviceRole = false, projectSlug }: {
    serviceRole?: boolean;
    projectSlug: string;
  },
): Promise<number> {
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    return 0;
  }

  const { count, error: countError } = await createClient(serviceRole)
    .from("keyword_trackers")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectData?.id)
    .eq("active", true);

  if (countError) {
    console.error("Error fetching total count:", countError);
  }

  return count || 0;
}
