import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Delete a keyword category
 * @param projectId - The ID of the project
 * @param categoryId - The ID of the category to delete
 * @returns Supabase query to delete a keyword category
 */
export const defineDeleteKeywordCategoryQuery = async (
  projectId: string,
  categoryId: string,
) => {
  const query = createClient()
    .from("keyword_categories")
    .delete()
    .match({
      project_id: projectId,
      id: categoryId,
    })
    .select(); // Return the deleted row(s)

  return query;
};

// Type for the query result
export type DeleteKeywordCategory = QueryData<
  ReturnType<typeof defineDeleteKeywordCategoryQuery>
>;
