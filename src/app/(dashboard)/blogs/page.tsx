import { redirect } from "next/navigation";
import { fetchBlogsWithAnalytics } from "@/features/blogs/actions/fetch-blogs-with-analytics";
import { BlogsDataTable } from "@/features/blogs/components/blog-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";
import { generateMockData } from "@/features/blogs/actions/mock-data";
import { LoggedInUser } from "@/features/common/types/types";
import { format } from "date-fns";
import { BlogTableHeader } from "@/features/blogs/components/blog-header";

export default async function Page() {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  const fetchedData = await fetchBlogsWithAnalytics(loggedInUser?.profile.id);

  // Collect all unique dates from blog_analytics
  const today = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return format(date, "yyyy-MM-dd"); // Format as YYYY-MM-DD
  }); // Ensure chronological order

  // Pass raw data and allDates to the client component
  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <BlogTableHeader profileId={loggedInUser?.profile.id} />
      <BlogsDataTable
        data={fetchedData}
        allDates={allDates}
        profileId={loggedInUser?.profile.id}
      />
    </div>
  );

  // const data = generateMockData();
  // Collect all unique dates from mock analytics
  // const dateSet = new Set<string>();
  // data.forEach((blog) => {
  //   Object.keys(blog.blog_analytics).forEach((date) => dateSet.add(date));
  // });
  // const allDates = Array.from(dateSet).sort();

  // return <BlogsDataTable data={data} allDates={allDates} />;
}
