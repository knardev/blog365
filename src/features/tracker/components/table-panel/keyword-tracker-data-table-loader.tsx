import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-results";
import { fetchTotalCount } from "@/features/tracker/actions/fetch-total-count";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { KeywordTrackerDataTable } from "@/features/tracker/components/table-panel/keyword-tracker-data-table";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export async function KeywordTrackerDataTableLoader({
  projectSlug,
  allDates,
  keywordCategories,
  readonly = false,
}: {
  projectSlug: string;
  allDates: string[];
  keywordCategories: KeywordCategories;
  readonly?: boolean;
}) {
  console.log("🚀 Fetching Data Table...");
  const fetchStartTime = performance.now();

  try {
    const [trackerResults, totalCountResult] = await Promise.all([
      fetchKeywordTrackerWithResults({
        projectSlug,
        offset: 0,
        limit: 20,
        serviceRole: readonly,
      }),
      fetchTotalCount({ projectSlug, serviceRole: readonly }),
    ]);

    console.log(
      `✅ Data Table Loaded (Duration: ${
        performance.now() - fetchStartTime
      } ms)`
    );

    return (
      <KeywordTrackerDataTable
        projectSlug={projectSlug}
        allDates={allDates}
        keywordCategories={keywordCategories}
        initialRows={trackerResults.data}
        totalCount={totalCountResult}
        readonly={readonly}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching Data Table:", error);
    return <p>⚠️ Failed to load data table.</p>;
  }
}
