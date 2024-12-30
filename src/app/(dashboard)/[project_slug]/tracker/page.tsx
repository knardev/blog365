import { redirect } from "next/navigation";
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";
import { LoggedInUser } from "@/features/common/types/types";
import { KeywordTrackerHeader } from "@/features/tracker/components/keyword-tracker-header";
import { format, subDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

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

  // 현재 UTC 기준 시간을 한국시간으로 변환
  const KST = "Asia/Seoul";
  const nowInKST = toZonedTime(new Date(), "Asia/Seoul"); // 수정된 호출

  // 한국시간 기준 어제 날짜 객체 생성
  const yesterdayDateInKST = subDays(nowInKST, 1);

  // 지난 30일의 날짜를 생성
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(yesterdayDateInKST, index); // 어제 날짜부터 하나씩 줄어드는 날짜 계산
    return formatInTimeZone(date, KST, "yyyy-MM-dd"); // 한국시간 기준으로 포맷팅
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
