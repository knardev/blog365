import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetch keywords data with optional filters
 * @returns Supabase query to fetch keywords
 */
export const defineFetchKeywords = async () => {
  // Fetch keywords
  const query = createClient()
    .from("keywords")
    .select(`
      *
    `)
    .order("created_at", { ascending: true }); // Order by created_at in ascending order

  return query;
};

// Type for the query result
export type Keywords = QueryData<ReturnType<typeof defineFetchKeywords>>[number];
