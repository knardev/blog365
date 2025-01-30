import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetch blogs and their analytics data with optional date filters
 * @param profileId - The ID of the profile to fetch blogs for
 * @returns Supabase query to fetch blogs with their analytics
 */
export const defineFetchBlogs = async (profileId: string) => {
  // Fetch blogs and their analytics
  const query = createClient()
    .from("blogs")
    .select(`*`)
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: true });

  return query;
};

// Type for the query result
export type Blogs = QueryData<ReturnType<typeof defineFetchBlogs>>;
