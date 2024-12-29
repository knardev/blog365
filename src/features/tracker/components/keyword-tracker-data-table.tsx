"use client";

import React, { useState } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { Button } from "@/components/ui/button";
import {
  KeywordTrackerTransformed,
  KeywordTrackerWithResultsResponse,
} from "@/features/tracker/types/types";
import { generateColumns } from "@/features/tracker/components/columns";

interface KeywordTrackerDataTableProps {
  data: KeywordTrackerWithResultsResponse;
  allDates: string[];
}

export function KeywordTrackerDataTable({
  data,
  allDates,
}: KeywordTrackerDataTableProps) {
  const keywordTrakers: KeywordTrackerTransformed[] = data.keyword_trackers;
  const columns = React.useMemo(() => generateColumns(allDates), [allDates]);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Initialize the table
  const table = useReactTable({
    data: keywordTrakers,
    columns,
    defaultColumn: {
      size: 100,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
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
      <div className="relative rounded-md border max-w-full overflow-x-auto overflow-y-auto flex flex-col min-h-0 h-[600px]">
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
            {keywordTrakers.length && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isStickyColumn =
                      cell.column.columnDef.meta?.isStickyColumn;
                    const stickyColumnLeft =
                      cell.column.columnDef.meta?.stickyColumnLeft ?? 0;
                    const isStickyRow = cell.column.columnDef.meta?.isStickyRow;
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
            ) : (
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

        {/* Pagination Controls */}
        {/* <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
          </Button>
        </div> */}
      </div>
    </div>
  );
}
