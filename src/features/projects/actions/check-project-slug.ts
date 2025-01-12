"use server";

import { defineCheckProjectSlugQuery } from "@/features/projects/queries/define-check-project-slug";

/**
 * Action to fetch the project
 * @param slug - The slug of the project to check for
 * @returns check flag
 */
export async function checkProjectSlug(
  slug: string,
): Promise<{ check: boolean; error?: string }> {
  const query = await defineCheckProjectSlugQuery(slug);

  const { count, error: countError } = query;

  if (countError) {
    const errorMessage =
      `Failed to fetch project with slug ${slug}: ${countError.message}`;
    console.error(errorMessage);
    return { check: false, error: errorMessage };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No projects found with the given slug.");
    return { check: false };
  }

  // This return handles all remaining cases where count > 0
  return { check: true };
}
