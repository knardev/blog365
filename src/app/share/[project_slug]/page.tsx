import { Metadata, ResolvingMetadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProjectBySlug } from "@/features/projects/actions/fetch-project-by-slug";
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

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
  const project = await fetchProjectBySlug(params.project_slug, true);

  if (!project) {
    return <div>데이터가 없습니다.</div>;
  }

  // Fetch data. 공유용 페이지에서는 strictMode = false 또는 true 지정 가능
  const [fetchedData, keywordCategories] = await Promise.all([
    fetchKeywordTrackerWithResults(
      params.project_slug,
      undefined,
      undefined,
      false,
      true
    ),
    fetchKeywordCategories(params.project_slug, true),
  ]);

  // 모든 날짜 생성 (지난 30일 예시)
  const KST = "Asia/Seoul";
  const now = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
  });

  if (!fetchedData) {
    // 공유 페이지에서 데이터가 없으면 404 등 처리
    return <div>데이터가 없습니다.</div>;
  }

  const {
    keyword_trackers: keywordTrackers,
    potential_exposure,
    today_catch_count,
    week_catch_count,
  } = fetchedData;

  const totalKeywords = keywordTrackers.length;

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-4">
        {/* 헤더에 프로젝트 이름 추가 */}
        <h2 className="text-xl font-bold">
          {project.name} | 상위노출 추적 결과
        </h2>
        <div className="w-full space-y-4">
          {/* Cards in a responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Total Keywords Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>전체 키워드</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{totalKeywords}</span>
              </CardContent>
            </Card>

            {/* Today's Caught Keywords */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>오늘 잡힌 키워드</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold">
                  {today_catch_count}
                </span>
              </CardContent>
            </Card>

            {/* Weekly Caught Keywords */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>일주일 전 잡은 키워드</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold">
                  {week_catch_count}
                </span>
              </CardContent>
            </Card>

            {/* Potential Exposure */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>일 예상 노출량</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold">
                  {potential_exposure.toFixed(0)} 회
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
        <KeywordTrackerDataTable
          data={fetchedData}
          allDates={allDates}
          keywordCategories={keywordCategories ?? []}
          projectSlug={params.project_slug}
          readonly={true}
        />
      </div>
    </div>
  );
}
