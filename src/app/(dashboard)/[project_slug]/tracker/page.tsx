import { redirect } from "next/navigation";
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
import { ProjectsBlogsPanel } from "@/features/tracker/components/projects-blogs-panel";
import { fetchBlog } from "@/features/blogs/actions/fetch-blogs";
import { fetchKeywordCategories } from "@/features/keyword/actions/fetch-keyword-categories";
import { getProfileData } from "@/features/common/actions/get-profile";
import { LoggedInUser } from "@/features/common/types/types";
import { format } from "date-fns";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default async function Page({
  params,
}: Readonly<{
  params: {
    project_slug: string;
  };
}>) {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  // Fetch data
  const [fetchedData, projectBlogs, availableBlogs, keywordCategories] =
    await Promise.all([
      fetchKeywordTrackerWithResults(params.project_slug),
      fetchProjectsBlogs(params.project_slug),
      fetchBlog(loggedInUser.profile.id),
      fetchKeywordCategories(params.project_slug),
    ]);

  // Generate allDates for the past 30 days
  const today = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return format(date, "yyyy-MM-dd");
  });

  if (!fetchedData || !projectBlogs) {
    return null;
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20} className="p-2">
        <ProjectsBlogsPanel
          blogs={projectBlogs}
          availableBlogs={availableBlogs}
          projectSlug={params.project_slug}
        />
      </ResizablePanel>
      <ResizablePanel defaultSize={80} className="p-2">
        <KeywordTrackerDataTable
          data={fetchedData}
          allDates={allDates}
          projectSlug={params.project_slug}
          keywordCategories={keywordCategories ?? []}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
