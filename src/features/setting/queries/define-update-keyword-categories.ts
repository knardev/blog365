import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Update a keyword category
 * @param projectId - The ID of the project
 * @param categoryId - The ID of the category to update
 * @param updates - Fields to update
 * @returns Supabase query to update a keyword category
 */
export const defineUpdateKeywordCategoryQuery = async (
  projectId: string,
  categoryId: string,
  updates: Partial<{ name: string }>,
) => {
  const query = createClient()
    .from("keyword_categories")
    .update(updates)
    .match({
      project_id: projectId,
      id: categoryId,
    })
    .select(); // Return the updated row(s)

  return query;
};

// Type for the query result
export type UpdateKeywordCategory = QueryData<
  ReturnType<typeof defineUpdateKeywordCategoryQuery>
>;
