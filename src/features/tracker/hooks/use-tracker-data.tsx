"use client";
// hooks
import { useEffect, useState } from "react";
// atoms
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-results";
import { MergedDataRow } from "@/features/tracker/types/types";

// useTrackerData.ts
export function useTrackerData({
  projectSlug,
  initialRows,
  totalCount,
  readonly = false,
  fetchBatch = 20,
}: {
  projectSlug: string;
  initialRows: MergedDataRow[];
  totalCount: number;
  readonly?: boolean;
  fetchBatch?: number;
}) {
  const [rows, setRows] = useState<MergedDataRow[]>(initialRows);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // If we've already fetched everything, don't fetch
    if (rows.length >= totalCount) return;
    if (isFetching) return;

    async function loadNextPage(offset: number) {
      setIsFetching(true);
      try {
        const result = await fetchKeywordTrackerWithResults({
          projectSlug,
          offset,
          limit: fetchBatch,
          serviceRole: readonly,
        });
        setRows((prev) => [...prev, ...result.data]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    }

    loadNextPage(rows.length);
  }, [rows, totalCount, isFetching, projectSlug, readonly, fetchBatch]);

  return {
    rows, // raw data
    isFetching, // are we currently fetching more?
  };
}
