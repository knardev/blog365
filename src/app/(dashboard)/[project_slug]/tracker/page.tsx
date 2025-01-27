// utils
import { redirect } from "next/navigation";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
// components
import { KeywordTrackerHeader } from "@/features/tracker/components/keyword-tracker-header";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
// actions
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
// types
import { LoggedInUser } from "@/features/common/types/types";

export const revalidate = 3600;
export const maxDuration = 60;

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    project_slug: string;
  };
  searchParams: {
    mode?: string;
  };
}) {
  const loggedInUser: LoggedInUser | null = await getProfileData();
  if (!loggedInUser) {
    redirect("/login");
  }

  // 서버 컴포넌트에서 최소한으로 필요한 정보만 미리 로드
  const keywordCategories = await fetchKeywordCategories(params.project_slug);

  // 예: 지난 30일치 날짜를 미리 생성
  const KST = "Asia/Seoul";
  const now = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
  });

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-4">
        <KeywordTrackerHeader
          profileId={loggedInUser.profile.id}
          projectSlug={params.project_slug}
        />
        <KeywordTrackerDataTable
          projectSlug={params.project_slug}
          allDates={allDates}
          keywordCategories={keywordCategories ?? []}
        />
      </div>
    </div>
  );
}
