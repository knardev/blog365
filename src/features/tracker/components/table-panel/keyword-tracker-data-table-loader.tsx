import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-results";
import { fetchTotalCount } from "@/features/tracker/actions/fetch-total-count";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { KeywordTrackerDataTable } from "@/features/tracker/components/table-panel/keyword-tracker-data-table";

export async function KeywordTrackerDataTableLoader({
  projectSlug,
  allDates,
  readonly = false,
}: {
  projectSlug: string;
  allDates: string[];
  readonly?: boolean;
}) {
  console.log("🚀 Fetching Data Table...");
  const fetchStartTime = performance.now();

  try {
    const [trackerResults, totalCountResult, categoriesResult] =
      await Promise.all([
        fetchKeywordTrackerWithResults({
          projectSlug,
          offset: 0,
          limit: 20,
          serviceRole: readonly,
        }),
        fetchTotalCount({ projectSlug, serviceRole: readonly }),
        fetchKeywordCategories(projectSlug, readonly),
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
        keywordCategories={categoriesResult ?? []}
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
