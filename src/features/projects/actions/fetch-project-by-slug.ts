// src/features/projects/actions/fetch-project-by-slug.ts
"use server";

import { defineFetchProjectBySlugQuery } from "../queries/define-fetch-project-by-slug";

export async function fetchProjectBySlug(
  projectSlug: string,
  serviceRole = false,
) {
  console.log(`[ACTION] Fetching project by slug: ${projectSlug}`);
  const { data, error } = await defineFetchProjectBySlugQuery(
    projectSlug,
    serviceRole,
  );

  if (error) {
    console.error("[ERROR] Failed to fetch project by slug:", error);
    return null;
  }

  // 없는 경우 data가 null일 수 있으므로 검사
  if (!data) {
    console.warn("[WARN] No project found with slug:", projectSlug);
    return null;
  }

  return data;
}
