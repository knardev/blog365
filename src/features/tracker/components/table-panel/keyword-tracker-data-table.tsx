"use client";
// hooks
import { useState, useMemo } from "react";
import { useTrackerData } from "@/features/tracker/hooks/use-tracker-data";
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
import { MergedDataRow } from "@/features/tracker/types/types";

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
  const { transformedData } = useTrackerData({
    projectSlug,
    initialRows,
    totalCount,
    readonly,
  });
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
    data: transformedData,
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
            {transformedData.length && table.getRowModel().rows?.length
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
              : transformedData.length == 0 && (
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
