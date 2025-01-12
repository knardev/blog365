import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetch keywords data with optional filters
 * @param projectId - The ID of the project to fetch keywords for
 * @param serviceRole - Whether to use the service role
 * @returns Supabase query to fetch keywords
 */
export const defineFetchKeywordCategoriesQuery = async (
  projectId: string,
  serviceRole: boolean = false,
) => {
  // Fetch keywords
  const query = createClient(serviceRole)
    .from("keyword_categories")
    .select(`
      *
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true }); // Order by created_at in ascending order

  return query;
};

// Type for the query result
export type KeywordCategories = QueryData<
  ReturnType<typeof defineFetchKeywordCategoriesQuery>
>;
