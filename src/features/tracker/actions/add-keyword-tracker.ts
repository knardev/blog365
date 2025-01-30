"use server";

import { createClient } from "@/utils/supabase/server";
import { defineAddKeyword } from "@/features/keyword/queries/define-add-keyword";
import { defineFilterKeyword } from "@/features/keyword/queries/define-filter-keyword";
import { defineAddKeywordTrackerQuery } from "@/features/tracker/queries/define-add-keyword-tracker";
import { defineFetchSingleKeywordTrackerQuery } from "@/features/tracker/queries/define-fetch-single-keyword-tracker";
// types
import { AddKeywordTracker } from "@/features/tracker/queries/define-add-keyword-tracker";

/**
 * Action to add multiple keywords tracker
 * @param projectSlug - The slug of the project
 * @param keywords - A comma-separated string of keywords
 * @param categoryId - (Optional) The ID of the category to associate with the tracker
 * @returns The result of the addition or an error if it occurs
 */
export async function addKeywordTracker({
  projectSlug,
  keywords,
  categoryId,
}: {
  projectSlug: string;
  keywords: string; // 콤마로 구분된 문자열
  categoryId?: string;
}): Promise<AddKeywordTracker[]> {
  // 1) 프로젝트 ID 찾기
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

  // 2) 콤마로 분리된 keywords -> 배열로 변환
  const keywordList = keywords
    // \r?\n 정규식으로 Windows(\r\n) / Unix(\n) 개행 모두 처리
    .split(/\r?\n/)
    // 각 라인의 앞뒤 공백 제거 및 모든 공백 제거
    .map((k) => k.trim().replace(/\s+/g, ""))
    .filter((k) => k.length > 0); // 빈 문자열 제거

  // 3) 키워드 배열을 순회하면서 기존 로직 수행
  const keywordTrackerList = [];
  for (const keyword of keywordList) {
    // Step 1: Try to filter the keyword by name
    const { data: filteredKeyword, error: filterError } =
      await defineFilterKeyword(keyword);
    if (filterError && filterError.code !== "PGRST116") {
      console.error("Error filtering keyword:", filterError);
      throw new Error("Failed to filter keyword");
    }

    let keywordId = filteredKeyword?.id;

    // Step 1: Check if the keyword tracker already exists
    if (keywordId) {
      const { data: existingKeywordTracker, error } =
        await defineFetchSingleKeywordTrackerQuery(
          projectId,
          keywordId,
        );
      if (existingKeywordTracker) {
        console.log("[Info] Keyword tracker already exists.");
        continue;
      }
    }

    // Step 2: If the keyword does not exist, add it
    if (!keywordId) {
      const { data: addedKeyword, error: addKeywordError } =
        await defineAddKeyword(keyword);
      if (addKeywordError) {
        console.error("Error adding keyword:", addKeywordError);
        throw new Error("Failed to add keyword");
      }
      keywordId = addedKeyword[0]?.id;
    }

    // Step 3: Add the keyword tracker
    const { data, error: trackerError } = await defineAddKeywordTrackerQuery(
      projectId,
      keywordId,
      categoryId, // Undefined if not provided
    );

    if (trackerError) {
      console.error("Error adding keyword tracker:", trackerError);
      throw new Error("Failed to add keyword tracker");
    }

    console.log("Keyword tracker added successfully:", data);
    keywordTrackerList.push(data);
  }
  return keywordTrackerList;

  // revalidatePath("/(main)/(dashboard)/[project_slug]/tracker");
}
