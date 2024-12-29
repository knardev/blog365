import { redirect } from "next/navigation";
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";
import { LoggedInUser } from "@/features/common/types/types";
import { KeywordTrackerHeader } from "@/features/tracker/components/keyword-tracker-header";
import { format, subDays } from "date-fns";

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
  const [fetchedData] = await Promise.all([
    fetchKeywordTrackerWithResults(params.project_slug),
  ]);

  // Generate allDates for the past 30 days
  const yesterday = subDays(new Date(), 1);
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(yesterday);
    date.setDate(yesterday.getDate() - index);
    return format(date, "yyyy-MM-dd");
  });

  if (!fetchedData) {
    return null;
  }

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-4">
        <KeywordTrackerHeader
          fetchedData={fetchedData}
          profileId={loggedInUser.profile.id}
          projectSlug={params.project_slug}
        />
        <KeywordTrackerDataTable data={fetchedData} allDates={allDates} />
      </div>
    </div>
  );
}
