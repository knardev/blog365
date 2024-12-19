import { BlogsWithAnalytics } from "@/features/blogs/types/types";

export function generateMockData(): BlogsWithAnalytics[] {
  const mockData: BlogsWithAnalytics[] = [];

  for (let i = 1; i <= 20; i++) {
    const blog = {
      id: `blog-${i}`,
      blog_slug: `naver_id_${i}`,
      name: `Blog ${i}`,
      owner_profile_id: `profile-${i}`,
      created_at: new Date().toISOString(),
      blog_analytics: generateMockAnalytics(),
    };

    mockData.push(blog);
  }

  return mockData;
}

// Generate mock analytics data for multiple dates
function generateMockAnalytics(): Record<string, { daily_visitor: number }> {
  const analytics: Record<string, { daily_visitor: number }> = {};
  const startDate = new Date("2023-01-01");
  const numberOfDays = 30; // 30 days for testing dynamic columns

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const formattedDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    analytics[formattedDate] = { daily_visitor: Math.floor(Math.random() * 500) + 1 }; // Random visitors
  }

  return analytics;
}
