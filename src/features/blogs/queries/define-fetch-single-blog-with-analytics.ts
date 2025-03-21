import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetch blogs and their analytics data with optional date filters
 * param blogId - The ID of the blog to fetch
 * @param startDate - Optional start date for filtering analytics data
 * @param endDate - Optional end date for filtering analytics data
 * @returns Supabase query to fetch blogs with their analytics
 * For startDate = "2023-10-01" and endDate = "2023-10-31", only analytics data within this range will be included in the blog_analytics array:
 */
export const defineFetchSingleBlogWithAnalytics = async (
  blogId: string,
  startDate?: string,
  endDate?: string,
) => {
  // Fetch blogs and their analytics
  const query = createClient()
    .from("blogs")
    .select(`
      *,
      blog_analytics (
        daily_visitor,
        date
      )
    `)
    .eq("id", blogId)
    .single();

  // Apply date filtering to blog_analytics
  // if (startDate || endDate) {
  //   query.filter("blog_analytics.date", "gte", startDate ?? "1970-01-01"); // Default start date if not provided
  //   query.filter("blog_analytics.date", "lte", endDate ?? "9999-12-31"); // Default end date if not provided
  // }

  return query;
};

// Type for the query result
export type BlogWithAnalytics = QueryData<
  ReturnType<typeof defineFetchSingleBlogWithAnalytics>
>;
