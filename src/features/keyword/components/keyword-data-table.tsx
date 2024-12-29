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
import { Input } from "@/components/ui/input";
import { generateColumns } from "@/features/keyword/components/columns";
import { KeywordTrackerWithAnalytics } from "@/features/keyword/types/types";
import { updateKeywordTracker } from "@/features/keyword/actions/update-keyword-tracker";
import { KeywordCategories } from "@/features/tracker/queries/define-fetch-keyword-categories";
import { KeywordTrackerAddSheet } from "@/features/tracker/components/keyword-tracker-add-sheet";

interface KeywordDataTableProps {
  data: KeywordTrackerWithAnalytics[];
  keywordCategories: KeywordCategories[];
  projectSlug: string;
}

export function KeywordDataTable({
  data,
  keywordCategories,
  projectSlug,
}: KeywordDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = React.useMemo(
    () => generateColumns(keywordCategories, projectSlug),
    [keywordCategories, projectSlug]
  );

  const table = useReactTable({
    data,
    columns,
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
    <div className="w-full h-full space-y-4">
      <div className="flex items-center justify-between w-full gap-2">
        <Input
          placeholder="키워드 검색"
          value={
            (table.getColumn("keywords.name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("keywords.name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <KeywordTrackerAddSheet
          projectSlug={projectSlug}
          keywordCategories={keywordCategories}
        />
      </div>
      <div className="relative rounded-md border max-w-full overflow-x-scroll">
        <Table className="h-full w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
  );
}
