import { Suspense } from "react";
import { redirect } from "next/navigation";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
// components
import { KeywordTrackerDataTableLoader } from "@/features/tracker/components/table-panel/keyword-tracker-data-table-loader";
import { SettingPanelLoader } from "@/features/tracker/components/setting-panel/setting-panel-loader";
import { KeywordTrackerStatisticsBoardLoader } from "@/features/tracker/components/statistics-panel/keyword-tracker-statistics-board-loader";
import { StatisticsPanelFallback } from "@/features/tracker/components/statistics-panel/statistics-panel-fallback";
import { ProjectsBlogsFallback } from "@/features/tracker/components/setting-panel/projects-blogs-fallback";
import { TablePanelFallback } from "@/features/tracker/components/table-panel/table-panel-fallback";
// actions
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";

export const revalidate = 3600;
export const maxDuration = 60;

export default async function Page({
  params,
}: {
  params: { project_slug: string };
}) {
  const loggedInUser = await getProfileData();
  if (!loggedInUser) redirect("/login");

  const projectSlug = params.project_slug;
  const profileId = loggedInUser.profile.id;

  // 📌 KST 기준 최근 30일 날짜 배열 생성
  const KST = "Asia/Seoul";
  const now = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
  });
  const categoriesResult = await fetchKeywordCategories(projectSlug);

  return (
    <div className="overflow-auto flex flex-1 flex-col space-y-4">
      <div className="w-full space-y-4">
        <Suspense fallback={<ProjectsBlogsFallback />}>
          <SettingPanelLoader
            projectSlug={projectSlug}
            profileId={profileId}
            categoriesResult={categoriesResult ?? []}
          />
        </Suspense>

        {/* ✅ 통계 데이터 로드 */}
        <Suspense fallback={<StatisticsPanelFallback />}>
          <KeywordTrackerStatisticsBoardLoader
            projectSlug={projectSlug}
            keywordCategories={categoriesResult ?? []}
          />
        </Suspense>
      </div>

      {/* ✅ 데이터 테이블 로딩 */}
      <Suspense fallback={<TablePanelFallback />}>
        <KeywordTrackerDataTableLoader
          projectSlug={projectSlug}
          allDates={allDates}
          keywordCategories={categoriesResult ?? []}
        />
      </Suspense>
    </div>
  );
}
