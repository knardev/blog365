"use client";
// hooks
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useTrackerData } from "@/features/tracker/hooks/use-tracker-data";
// atoms
import {
  strictModeAtom,
  visibleProjectsBlogsAtom,
} from "@/features/tracker/atoms/states";
import { trackerTableDataAtom } from "@/features/tracker/atoms/states";
// components
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateColumns } from "@/features/tracker/components/table-panel/columns";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import {
  MergedDataRow,
  KeywordTrackerTransformed,
  DailyResult,
} from "@/features/tracker/types/types";

interface KeywordTrackerDataTableProps {
  projectSlug: string;
  allDates: string[];
  keywordCategories: KeywordCategories;
  initialRows: MergedDataRow[];
  totalCount: number;
  readonly?: boolean;
}

export function KeywordTrackerDataTable({
  allDates,
  keywordCategories,
  projectSlug,
  initialRows,
  totalCount,
  readonly = false,
}: KeywordTrackerDataTableProps) {
  const [trackerTableData, setTrackerTableData] =
    useRecoilState(trackerTableDataAtom);
  // 1) Only fetch rows here.
  const { rows, isFetching } = useTrackerData({
    projectSlug,
    initialRows,
    totalCount,
    readonly,
    // fetchBatch: 20,  // optional override
  });

  // 2) transform the data here:
  const strictMode = useRecoilValue(strictModeAtom);
  const visibleProjectsBlogs = useRecoilValue(visibleProjectsBlogsAtom);

  // do your transform
  const transformTrackerData = useCallback(
    (rows: MergedDataRow[]) => {
      console.log("🔄 Transforming tracker data...");
      const maxRankPopular = strictMode ? 2 : 7;
      const maxRankNormal = strictMode ? 2 : 3;

      return rows.map((tracker) => {
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

          // sort catch_result ascending by rank
          resultsMap[date].catch_result.sort(
            (a, b) => a.rank_in_smart_block - b.rank_in_smart_block
          );
        });
        // console.log("resultsMap", resultsMap);

        return {
          ...tracker,
          keyword_tracker_results: resultsMap,
          keyword_analytics: {
            ...tracker.keyword_analytics,
            daily_first_page_exposure: 0,
          },
        };
      });
    },
    [strictMode, visibleProjectsBlogs]
  );

  // 3) useMemo for performance (avoid re-transforms on every render)
  const transformed = useMemo(
    () => transformTrackerData(rows),
    [rows, transformTrackerData]
  );

  // store to Recoil if needed, or you can simply use `transformed`:
  useEffect(() => {
    // If you truly need to store the transformed data in Recoil, do it once here:
    setTrackerTableData(transformed);
  }, [transformed, setTrackerTableData]);

  // 1) DEFAULT SORTING (multi-sort)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "keyword_categories.name", desc: false },
    { id: "keyword_analytics.montly_search_volume", desc: true },
  ]);
  // 2) Category Filter
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // 3) columns
  const columns = useMemo(
    () => generateColumns(allDates, keywordCategories, projectSlug, readonly),
    [allDates, keywordCategories, projectSlug, readonly]
  );

  // 7) Set up the table
  const table = useReactTable({
    data: trackerTableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    enableMultiSort: true,
    maxMultiSortColCount: 2,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full flex flex-col space-y-2 flex-1">
      {/* Filter by Keyword */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* <Input
          placeholder="키워드로 검색"
          value={
            (table.getColumn("keywords.name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("keywords.name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        /> */}
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div
        // ref={tableContainerRef}
        // onScroll={onScroll}
        className="relative rounded-md border max-w-full overflow-x-auto overflow-y-auto flex flex-col min-h-0 h-[600px]"
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isStickyColumn =
                    header.column.columnDef.meta?.isStickyColumn;
                  const stickyColumnLeft =
                    header.column.columnDef.meta?.stickyColumnLeft ?? 0;
                  const isStickyRow = header.column.columnDef.meta?.isStickyRow;
                  const isLastSticky =
                    header.column.columnDef.meta?.isLastSticky;
                  const isStickyMobileColumn =
                    header.column.columnDef.meta?.isStickyMobileColumn;
                  return (
                    <TableHead
                      key={header.id}
                      width={`${header.getSize()}px`}
                      isStickyColumn={isStickyColumn}
                      stickyColumnLeft={stickyColumnLeft}
                      isStickyRow={isStickyRow}
                      isStickyMobileColumn={isStickyMobileColumn}
                      isLastSticky={isLastSticky}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {trackerTableData.length && table.getRowModel().rows?.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isStickyColumn =
                        cell.column.columnDef.meta?.isStickyColumn;
                      const stickyColumnLeft =
                        cell.column.columnDef.meta?.stickyColumnLeft ?? 0;
                      const isStickyRow =
                        cell.column.columnDef.meta?.isStickyRow;
                      const isLastSticky =
                        cell.column.columnDef.meta?.isLastSticky;
                      const isStickyMobileColumn =
                        cell.column.columnDef.meta?.isStickyMobileColumn;

                      const cellValue = Number(cell.getValue()) || 0;

                      // Determine background color based on the value
                      const getBackgroundColor = (value: number) => {
                        if (value >= 3) return "#15803d";
                        if (value >= 2) return "#22c55e";
                        if (value >= 1) return "#86efac";
                        if (value > 0) return "#dcfce7";
                        return undefined;
                      };

                      // 텍스트 색상 반환
                      const getTextClass = (value: number) => {
                        if (value >= 3) return "text-white";
                        if (value >= 2) return "text-slate-800";
                        if (value >= 1) return "text-slate-800";
                        if (value > 0) return "text-slate-800";
                        return "text-muted-foreground";
                      };

                      const backgroundColor = isStickyColumn
                        ? undefined
                        : getBackgroundColor(cellValue);

                      const textClass = isStickyColumn
                        ? ""
                        : getTextClass(cellValue);

                      return (
                        <TableCell
                          key={cell.id}
                          width={`${cell.column.getSize()}px`}
                          isStickyColumn={isStickyColumn}
                          stickyColumnLeft={stickyColumnLeft}
                          isStickyRow={isStickyRow}
                          isStickyMobileColumn={isStickyMobileColumn}
                          isLastSticky={isLastSticky}
                          backgroundColor={backgroundColor}
                          className={textClass}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              : trackerTableData.length == 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      키워드 트래커가 없습니다. 추가해주세요.
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
