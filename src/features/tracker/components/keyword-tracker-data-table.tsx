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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { KeywordTrackerWithResults } from "@/features/tracker/types/types";
import { generateColumns } from "@/features/tracker/components/columns";
import { KeywordTrackerAddDialog } from "@/features/keyword/components/keyword-tracker-add-dialog";
import { KeywordCategories } from "@/features/keyword/queries/define-fetch-keyword-categories";

interface KeywordTrackerDataTableProps {
  data: KeywordTrackerWithResults[];
  allDates: string[];
  projectSlug: string;
  keywordCategories: KeywordCategories[];
}

export function KeywordTrackerDataTable({
  data,
  allDates,
  projectSlug,
  keywordCategories,
}: KeywordTrackerDataTableProps) {
  const columns = React.useMemo(() => generateColumns(allDates), [allDates]);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      size: 100,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    <div className="w-full h-full space-y-4 flex flex-col">
      {/* Filter by Keyword */}
      <div className="flex items-center justify-between w-full gap-2">
        <Input
          placeholder="키워드로 검색"
          value={
            (table.getColumn("keywords.name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("keywords.name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <KeywordTrackerAddDialog
          projectSlug={projectSlug}
          revalidateTargetPath={`/${projectSlug}/tracker`}
          keywordCategories={keywordCategories}
        />
      </div>

      {/* Main Content: Table and Pagination */}
      <div className="flex flex-col justify-between h-full flex-1">
        {/* Table Container with Horizontal Scroll */}
        <div className="relative rounded-md border max-w-full overflow-x-scroll mb-4">
          <Table className="h-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isSticky = header.column.columnDef.meta?.sticky;
                    const left = header.column.columnDef.meta?.left ?? 0;
                    const isLastSticky =
                      header.column.columnDef.meta?.isLastSticky;
                    return (
                      <TableHead
                        key={header.id}
                        width={`${header.getSize()}px`}
                        isSticky={isSticky}
                        isLastSticky={isLastSticky}
                        left={isSticky ? `${left}px` : undefined}
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
              {data.length && table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isSticky = cell.column.columnDef.meta?.sticky;
                      const left = cell.column.columnDef.meta?.left ?? 0;
                      const isLastSticky =
                        cell.column.columnDef.meta?.isLastSticky;
                      return (
                        <TableCell
                          key={cell.id}
                          width={`${cell.column.getSize()}px`}
                          isSticky={isSticky}
                          isLastSticky={isLastSticky}
                          left={isSticky ? `${left}px` : undefined}
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
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center">
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
        </div>
      </div>
    </div>
  );
}
