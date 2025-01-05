import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchBlog } from "@/features/blogs/actions/fetch-blogs";
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { ProjectsBlogsSheet } from "@/features/tracker/components/projects-blogs-sheet";
import { KeywordTrackerAddSheet } from "@/features/tracker/components/keyword-tracker-add-sheet";
import { KeywordTrackerWithResultsResponse } from "@/features/tracker/types/types"; // 방금 만든 atom 임포트
import { StrictModeSwitch } from "./strict-mode-switch";

export async function KeywordTrackerHeader({
  profileId,
  projectSlug,
  fetchedData,
}: {
  profileId: string;
  projectSlug: string;
  fetchedData: KeywordTrackerWithResultsResponse;
}) {
  // Fetch supplementary data
  const [projectBlogs, availableBlogs, keywordCategories] = await Promise.all([
    fetchProjectsBlogs(projectSlug),
    fetchBlog(profileId),
    fetchKeywordCategories(projectSlug),
  ]);

  if (!projectBlogs || !fetchedData) {
    return null;
  }

  // Extract data from fetchedData
  const {
    keyword_trackers: keywordTrackers,
    potential_exposure,
    today_catch_count,
    week_catch_count,
  } = fetchedData;

  // Calculate the total number of keywords
  const totalKeywords = keywordTrackers.length;

  return (
    <div className="w-full space-y-4">
      {/* Buttons in a responsive row */}
      <div className="flex justify-between items-center">
        <StrictModeSwitch />
        <div className="flex gap-2">
          <ProjectsBlogsSheet
            blogs={projectBlogs}
            availableBlogs={availableBlogs}
            projectSlug={projectSlug}
          />
          <KeywordTrackerAddSheet
            projectSlug={projectSlug}
            keywordCategories={keywordCategories ?? []}
          />
        </div>
      </div>
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
            <span className="text-2xl font-semibold">{today_catch_count}</span>
          </CardContent>
        </Card>

        {/* Weekly Caught Keywords */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>일주일 전 잡은 키워드</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{week_catch_count}</span>
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
  );
}
