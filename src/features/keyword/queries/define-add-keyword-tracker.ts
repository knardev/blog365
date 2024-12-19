import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new keyword_tracker entry
 * @param projectId - The ID of the project
 * @param keywordId - The ID of the keyword
 * @param categoryId - (Optional) The ID of the category
 * @returns The Supabase query object for insertion
 */
export const defineAddKeywordTrackerQuery = (
  projectId: string,
  keywordId: string,
  categoryId?: string
) => {
  return createClient()
    .from("keyword_trackers")
    .insert({
      project_id: projectId,
      keyword_id: keywordId,
      category_id: categoryId || null,
      active: true,
    })
    .select();
};

export type AddKeywordTracker = QueryData<
  ReturnType<typeof defineAddKeywordTrackerQuery>
>;

// Example Usage:
// const result = await defineAddKeywordTrackerQuery("project-id", "keyword-id", "category-id");
// console.log(result);
