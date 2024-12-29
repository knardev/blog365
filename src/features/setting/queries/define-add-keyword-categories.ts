import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Add a new keyword category
 * @param projectId - The ID of the project
 * @param name - The name of the keyword category
 * @returns Supabase query to add a keyword category
 */
export const defineAddKeywordCategoryQuery = async (
  projectId: string,
  name: string,
) => {
  const query = createClient()
    .from("keyword_categories")
    .insert({
      project_id: projectId,
      name,
    })
    .select(); // Return the inserted row(s)

  return query;
};

// Type for the query result
export type AddKeywordCategory = QueryData<
  ReturnType<typeof defineAddKeywordCategoryQuery>
>;
