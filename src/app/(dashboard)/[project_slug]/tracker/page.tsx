import { redirect } from "next/navigation";
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";
import { LoggedInUser } from "@/features/common/types/types";
import { KeywordTrackerHeader } from "@/features/tracker/components/keyword-tracker-header";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getYesterdayInKST } from "@/utils/date";

export const revalidate = 3600;
export const maxDuration = 60;

export default async function Page({
  params,
  searchParams, // 여기서 쿼리 파라미터를 받을 수 있음
}: {
  params: {
    project_slug: string;
  };
  searchParams: {
    mode?: string; // ?mode=strict 가 들어올 수 있음
  };
}) {
  const loggedInUser: LoggedInUser | null = await getProfileData();
  if (!loggedInUser) {
    redirect("/login");
  }

  // ?mode=strict 여부 판별
  const isStrictMode = searchParams.mode === "strict";

  // Fetch data (strictMode를 네 번째 인자로 넘김)
  const [fetchedData, keywordCategories] = await Promise.all([
    fetchKeywordTrackerWithResults(
      params.project_slug,
      undefined,
      undefined,
      isStrictMode
    ),
    fetchKeywordCategories(params.project_slug),
  ]);
  // console.log(fetchedData);

  // 현재 UTC 기준 시간을 한국시간으로 변환
  const KST = "Asia/Seoul";
  const now = new Date();

  // 한국시간 기준 어제 날짜 객체 생성
  const yesterdayDate = subDays(now, 1);

  // 지난 30일의 날짜를 생성
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
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
        <KeywordTrackerDataTable
          data={fetchedData}
          allDates={allDates}
          keywordCategories={keywordCategories ?? []}
          projectSlug={params.project_slug}
        />
      </div>
    </div>
  );
}
