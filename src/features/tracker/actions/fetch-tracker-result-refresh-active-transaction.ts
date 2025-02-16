"use server";

import { createClient } from "@/utils/supabase/server";
// types
import {
  defineFetchTrackerResultRefreshActiveTransactionQuery,
  FetchTrackerResultRefreshTransaction,
} from "@/features/tracker/queries/define-fetch-tracker-result-refresh-active-transaction";

export async function fetchTrackerResultRefreshActiveTransaction({
  project_slug,
}: {
  project_slug: string;
}): Promise<FetchTrackerResultRefreshTransaction | null> {
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

  const { data, error } =
    await defineFetchTrackerResultRefreshActiveTransactionQuery({
      project_id: projectId,
    });

  if (error) {
    // 에러 코드 PGRST116: 0 행 반환인 경우, 에러 대신 null을 반환
    if (error.code === "PGRST116") {
      console.log("No active refresh transaction found");
      return null;
    } else {
      console.error("Error adding tracker result refresh transaction:", error);
      throw new Error("Failed to add tracker result refresh transaction");
    }
  }

  return data;
}
