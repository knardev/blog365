// components
import { KeywordTrackerStatisticsBoard } from "@/features/tracker/components/statistics-panel/keyword-tracker-statistics-borad";
// actions
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export async function KeywordTrackerStatisticsBoardLoader({
  projectSlug,
  keywordCategories,
  readonly = false,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories;
  readonly?: boolean;
}) {
  console.log("🚀 Fetching Statistics Board Data...");
  const fetchStartTime = performance.now();

  try {
    const [trackerResultsAll] = await Promise.all([
      fetchKeywordTrackerWithResults({
        projectSlug,
        fetchAll: true,
        serviceRole: readonly,
      }),
    ]);

    const { data } = trackerResultsAll;

    console.log(
      `✅ Statistics Board Loaded (Duration: ${
        performance.now() - fetchStartTime
      } ms)`
    );

    return (
      <KeywordTrackerStatisticsBoard
        projectSlug={projectSlug}
        initialTrackerData={data}
        keywordCategories={keywordCategories}
        readonly={readonly}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching Statistics Board:", error);
    return <p>⚠️ Failed to load statistics board.</p>;
  }
}
