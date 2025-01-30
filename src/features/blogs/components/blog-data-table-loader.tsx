"use server";

// components
import { BlogsDataTable } from "@/features/blogs/components/blog-data-table";
// actions
import { fetchBlogsWithAnalytics } from "@/features/blogs/actions/fetch-blogs-with-analytics";
// utils
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export async function BlogDataTableLoader({
  profileId,
}: {
  profileId: string;
}) {
  console.log("🚀 Fetching Blog Data Table...");
  const fetchStartTime = performance.now();

  try {
    // 2) Fetch blogs with analytics data
    const fetchedData = await fetchBlogsWithAnalytics(profileId);

    // 3) Generate the past 30 dates in KST
    const KST = "Asia/Seoul";
    const now = new Date();
    const yesterdayDate = subDays(now, 1);

    const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
      const date = subDays(yesterdayDate, index);
      return formatInTimeZone(date, KST, "yyyy-MM-dd");
    });

    console.log(
      `✅ Blog Data Table Loaded (Duration: ${
        performance.now() - fetchStartTime
      } ms)`
    );

    // 4) Return the client components with fetched data
    return (
      <BlogsDataTable
        data={fetchedData}
        allDates={allDates}
        profileId={profileId}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching Blog Data Table:", error);
    return <p>⚠️ Failed to load blog data table.</p>;
  }
}
