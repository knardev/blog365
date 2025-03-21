"use server";

import { defineFetchBlogsWithAnalytics } from "../queries/define-fetch-blogs-with-analytics";
import { BlogsWithAnalytics } from "../types/types";
import { getYesterdayInKST } from "@/utils/date";

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
  endDate?: string,
): Promise<BlogsWithAnalytics[]> {
  // Fetch blogs and analytics
  const query = await defineFetchBlogsWithAnalytics(
    profileId,
    startDate,
    endDate,
  );

  const { data, error } = query;

  if (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }

  const yesterday = getYesterdayInKST();
  const sevenDaysAgo = new Date(yesterday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // 최근 7일
  const oneMonthAgo = new Date(yesterday);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // 최근 1개월

  // Format dates as "YYYY-MM-DD"
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const sevenDaysAgoStr = formatDate(sevenDaysAgo);
  const oneMonthAgoStr = formatDate(oneMonthAgo);

  // Server-side data transformation
  const transformedData = data.map((blog) => {
    const analyticsMap: Record<string, { daily_visitor: number }> = {};

    blog.blog_analytics?.forEach((analytic) => {
      analyticsMap[analytic.date] = { daily_visitor: analytic.daily_visitor };
    });

    // Calculate averages
    const dates = Object.keys(analyticsMap).sort(); // Sorted date keys
    const recentSevenDays = dates.filter((date) =>
      date >= sevenDaysAgoStr && date <= yesterday
    );
    const recentOneMonth = dates.filter((date) =>
      date >= oneMonthAgoStr && date <= yesterday
    );

    const averageDailyVisitors = (selectedDates: string[]) => {
      if (selectedDates.length === 0) return 0;
      const totalVisitors = selectedDates.reduce(
        (sum, date) => sum + analyticsMap[date].daily_visitor,
        0,
      );
      return Math.floor(totalVisitors / selectedDates.length); // 정수 반환
    };

    return {
      ...blog,
      blog_analytics: analyticsMap, // Replace array with a date-keyed object
      average_daily_visitors_7_days: averageDailyVisitors(recentSevenDays),
      average_daily_visitors_1_month: averageDailyVisitors(recentOneMonth),
    };
  });

  return transformedData;
}
