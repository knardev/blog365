import { Metadata, ResolvingMetadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProjectBySlug } from "@/features/projects/actions/fetch-project-by-slug";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
// components
import { KeywordTrackerDataTableLoader } from "@/features/tracker/components/table-panel/keyword-tracker-data-table-loader";
import { KeywordTrackerStatisticsBoardLoader } from "@/features/tracker/components/statistics-panel/keyword-tracker-statistics-board-loader";
import { StatisticsPanelFallback } from "@/features/tracker/components/statistics-panel/statistics-panel-fallback";
import { TablePanelFallback } from "@/features/tracker/components/table-panel/table-panel-fallback";
// actions
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";

export const revalidate = 3600;
export const maxDuration = 60;

// Metadata 생성 함수
export async function generateMetadata(
  { params }: { params: { project_slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // 프로젝트 정보를 가져오기
  const project = await fetchProjectBySlug(params.project_slug, true);

  if (!project) {
    return {
      title: "상위노출 결과",
      description: "현재 공유된 프로젝트에 대한 키워드 데이터가 없습니다.",
    };
  }

  const projectTitle = `${project.name} | 상위노출 결과`;

  return {
    title: projectTitle,
    description: `${project.name} 프로젝트의 상위노출 결과입니다.`,
    openGraph: {
      title: projectTitle,
      description: `${project.name} 프로젝트의 상위노출 결과입니다.`,
      images: [
        {
          url: "/images/default-share-image.png", // 프로젝트 이미지가 있을 경우 사용, 없으면 기본 이미지
          width: 800,
          height: 600,
          alt: `${project.name} Keyword Tracker Share Page`,
        },
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: {
    project_slug: string;
  };
}) {
  // 프로젝트 정보 가져오기
  const projectSlug = params.project_slug;
  const project = await fetchProjectBySlug(params.project_slug, true);

  if (!project) {
    return <div>데이터가 없습니다.</div>;
  }

  const categoriesResult = await fetchKeywordCategories(projectSlug);

  // 모든 날짜 생성 (지난 30일 예시)
  const KST = "Asia/Seoul";
  const now = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
  });

  return (
    <div className="overflow-auto flex flex-1 flex-col space-y-4">
      <h2 className="text-xl font-bold">{project.name} | 상위노출 추적 결과</h2>
      <div className="w-full space-y-4">
        {/* ✅ 통계 데이터 로드 */}
        <Suspense fallback={<StatisticsPanelFallback />}>
          <KeywordTrackerStatisticsBoardLoader
            projectSlug={projectSlug}
            keywordCategories={categoriesResult ?? []}
            readonly={true}
          />
        </Suspense>
      </div>

      {/* ✅ 데이터 테이블 로딩 */}
      <Suspense fallback={<TablePanelFallback />}>
        <KeywordTrackerDataTableLoader
          projectSlug={projectSlug}
          allDates={allDates}
          readonly={true}
        />
      </Suspense>
    </div>
  );
}
