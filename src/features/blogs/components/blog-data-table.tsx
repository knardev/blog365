"use client";

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogsWithAnalytics } from "@/features/blogs/types/types";
import { generateColumns } from "@/features/blogs/components/columns"; // Import the column generator
import { BlogAddDialog } from "./blog-add-dialog";

interface BlogsDataTableProps {
  data: BlogsWithAnalytics[];
  allDates: string[];
  profileId: string;
}

export function BlogsDataTable({
  data,
  allDates,
  profileId,
}: BlogsDataTableProps) {
  const columns = React.useMemo(() => generateColumns(allDates), [allDates]);

  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      size: 100, // base size for columns without explicit size
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
    <div className="w-full h-full space-y-4 p-2">
      {/* Filter by Naver ID */}
      <div className="flex items-center justify-between w-full gap-2">
        <Input
          placeholder="블로그 ID로 검색"
          value={
            (table.getColumn("blog_slug")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("blog_slug")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <BlogAddDialog profileId={profileId} revalidateTargetPath={`/blogs`} />
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="relative rounded-md border max-w-full overflow-x-scroll">
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
                  블로그가 없습니다. 블로그를 추가해주세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
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
