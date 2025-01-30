import { useEffect, useState, useRef, useCallback } from "react";
import { useRecoilValue } from "recoil";
import {
  strictModeAtom,
  visibleProjectsBlogsAtom,
} from "@/features/tracker/atoms/states";
import { fetchKeywordTrackerWithResults } from "../actions/fetch-keyword-tracker-with-results";

import {
  MergedDataRow,
  KeywordTrackerTransformed,
  DailyResult,
} from "@/features/tracker/types/types";

export const useTrackerData = ({
  projectSlug,
  initialRows,
  totalCount,
  readonly = false,
  fetchAll = false,
}: {
  projectSlug: string;
  initialRows: MergedDataRow[];
  totalCount: number;
  readonly?: boolean;
  fetchAll?: boolean;
}) => {
  // console.log("🚀 Initializing `useTrackerData` hook");

  const fetchBatch = 20;
  const strictMode = useRecoilValue(strictModeAtom);
  const visibleProjectsBlogs = useRecoilValue(visibleProjectsBlogsAtom);
  // console.log("🛠 Strict Mode:", strictMode);

  const [rows, setRows] = useState<MergedDataRow[]>(initialRows);
  const [transformedData, setTransformedData] = useState<
    KeywordTrackerTransformed[]
  >([]);

  const totalCountRef = useRef(totalCount);
  const offsetRef = useRef<number>(fetchBatch);
  const [hasNextPage, setHasNextPage] = useState(
    fetchAll ? false : offsetRef.current < totalCountRef.current
  );
  const [isFetching, setIsFetching] = useState(false);

  // console.log("👉 Initial State: ", {
  //   rows,
  //   totalCount,
  //   fetchAll,
  //   hasNextPage,
  //   offset: offsetRef.current,
  // });

  const transformTrackerData = useCallback(
    (rows: MergedDataRow[]) => {
      // console.log("🔄 Transforming tracker data...");
      const maxRankPopular = strictMode ? 2 : 7;
      const maxRankNormal = strictMode ? 2 : 3;

      const transformed = rows.map((tracker) => {
        const resultsMap: Record<string, DailyResult> = {};

        tracker.raw_results.forEach((result) => {
          const date = result.date;
          if (!resultsMap[date]) {
            resultsMap[date] = { catch_success: 0, catch_result: [] };
          }

          const isPopularPost =
            result.smart_block_name?.includes("인기글") ?? false;

          if (result.blog_id) {
            if (
              visibleProjectsBlogs.includes(result.blog_id) &&
              result.rank_in_smart_block !== null &&
              result.rank_in_smart_block <=
                (isPopularPost ? maxRankPopular : maxRankNormal)
            ) {
              resultsMap[date].catch_success += 1;
            }
          }

          resultsMap[date].catch_result.push({
            post_url: result.post_url ?? "N/A",
            smart_block_name: result.smart_block_name ?? "N/A",
            rank_in_smart_block: result.rank_in_smart_block ?? -1,
          });

          resultsMap[date].catch_result.sort(
            (a, b) => a.rank_in_smart_block - b.rank_in_smart_block
          );
        });

        return {
          ...tracker,
          keyword_tracker_results: resultsMap,
          keyword_analytics: {
            ...tracker.keyword_analytics,
            daily_first_page_exposure: 0,
          },
        };
      });

      // console.log("✅ Transformed Data:", transformed);
      return transformed;
    },
    [strictMode, visibleProjectsBlogs]
  );

  const loadNextPage = useCallback(async () => {
    if (isFetching || !hasNextPage) {
      // console.log(
      //   "⚠️ Skipping fetch. Either already fetching or no next page."
      // );
      return;
    }

    // console.log("🚀 Fetching next page...");
    setIsFetching(true);

    try {
      const result = await fetchKeywordTrackerWithResults({
        projectSlug,
        offset: offsetRef.current,
        limit: fetchBatch,
        serviceRole: readonly,
      });

      // console.log("✅ Fetch successful:", result);
      setRows((prev) => {
        const newRows = [...prev, ...result.data];
        // console.log("🛠 Updating rows:", newRows);
        return newRows;
      });

      offsetRef.current += fetchBatch;
      // console.log("👉 New offset:", offsetRef.current);

      if (offsetRef.current >= totalCountRef.current) {
        // console.log("🛑 No more pages to fetch");
        setHasNextPage(false);
      }
    } catch (error) {
      // console.error("❌ Failed to load next page:", error);
    } finally {
      setIsFetching(false);
    }
  }, [projectSlug, hasNextPage, isFetching, readonly, fetchBatch]);

  // Initialize rows from props
  useEffect(() => {
    // console.log("🛠 Setting initial rows from props:", initialRows);
    setRows(initialRows);
  }, [initialRows]);

  // Automatically load next page on mount or when dependencies change
  useEffect(() => {
    if (!fetchAll && hasNextPage && !isFetching) {
      // console.log("🚀 Loading next page automatically...");
      loadNextPage();
    } else {
      // console.log("⚠️ Skipping automatic page load. Conditions not met.");
    }
  }, [hasNextPage, isFetching, fetchAll, loadNextPage]);

  // Transform data whenever `rows` or `strictMode` changes
  useEffect(() => {
    // console.log("🔄 Transforming data based on rows/strictMode...");
    setTransformedData(transformTrackerData(rows));
  }, [rows, transformTrackerData]);

  // console.log("📊 Returning transformed data...");
  return { transformedData, loadNextPage, hasNextPage, isFetching };
};
