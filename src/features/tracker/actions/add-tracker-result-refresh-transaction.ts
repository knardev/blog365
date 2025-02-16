"use server";

import { createClient } from "@/utils/supabase/server";
// types
import {
  AddTrackerResultRefreshTransaction,
  defineAddTrackerResultRefreshTransactionsQuery,
} from "@/features/tracker/queries/define-add-tracker-result-refresh-transaction";

export async function addTrackerResultRefreshTransaction({
  project_slug,
  refresh_date,
  total_count,
}: {
  project_slug: string;
  refresh_date: string;
  total_count: number;
}): Promise<AddTrackerResultRefreshTransaction> {
  // 1) 프로젝트 ID 찾기
  const { data: projectData, error: projectError } = await createClient()
    .from("projects")
    .select("id")
    .eq("slug", project_slug)
    .single();

  if (projectError) {
    console.error("Error fetching project by slug:", projectError);
    throw new Error("Failed to fetch project by slug");
  }

  const projectId = projectData?.id;

  if (!projectId) {
    throw new Error("Project not found");
  }

  const { data, error } = await defineAddTrackerResultRefreshTransactionsQuery(
    {
      project_id: projectId,
      refresh_date,
      total_count,
    },
  );

  if (error) {
    console.error("Error adding tracker result refresh transaction:", error);
    throw new Error("Failed to add tracker result refresh transaction");
  }

  return data;
}
