"use server";

import { defineFetchBlogsWithAnalytics } from "../queries/define-fetch-blogs-with-analytics";
import { BlogsWithAnalytics } from "../types/types";

/**
 * Action to fetch blogs and transform the data
 * @param profileId - The ID of the profile to fetch blogs for
 * @param startDate - (Optional) The start date for filtering results
 * @param endDate - (Optional) The end date for filtering results
 * @returns Transformed blogs with analytics
 */

export async function fetchBlogsWithAnalytics(
  profileId: string,
  startDate?: string,
  endDate?: string
): Promise<BlogsWithAnalytics[]> {
  // Fetch blogs and analytics
  const query = await defineFetchBlogsWithAnalytics(profileId, startDate, endDate);

  const { data, error } = query;

  if (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }

  // Server-side data transformation
  const transformedData = data.map((blog) => {
    const analyticsMap: Record<string, { daily_visitor: number }> = {};

    blog.blog_analytics?.forEach((analytic) => {
      analyticsMap[analytic.date] = { daily_visitor: analytic.daily_visitor };
    });

    return {
      ...blog,
      blog_analytics: analyticsMap, // Replace array with a date-keyed object
    };
  });

  return transformedData;
}

// [
//   {
//     id: "uuid-1",
//     naver_id: "example_blog",
//     created_at: "2023-10-01T00:00:00Z",
//     blog_analytics: {
//       "2023-10-10": { daily_visitor: 111 },
//       "2023-10-11": { daily_visitor: 222 },
//       "2023-10-12": { daily_visitor: 333 }
//     }
//   },
//   ...
// ];
