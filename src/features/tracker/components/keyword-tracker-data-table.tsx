"use client";

// states
import { strictModeState } from "@/features/tracker/atoms/states";
// hooks
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRecoilValue } from "recoil";
// components
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  OnChangeFn,
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
import { Skeleton } from "@/components/ui/skeleton";
import { generateColumns } from "@/features/tracker/components/columns";
// actions
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { fetchTotalCount } from "@/features/tracker/actions/fetch-total-count";
// quries
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
// types
import {
  KeywordTrackerTransformed,
  KeywordTrackerWithResultsResponse,
} from "@/features/tracker/types/types";

interface KeywordTrackerDataTableProps {
  projectSlug: string;
  allDates: string[];
  keywordCategories: KeywordCategories;
  readonly?: boolean;
}

export function KeywordTrackerDataTable({
  allDates,
  keywordCategories,
  projectSlug,
  readonly = false,
}: KeywordTrackerDataTableProps) {
  // [1] 정렬 상태
  const [sorting, setSorting] = useState<SortingState>([]);
  // [2] 불러온 데이터 누적
  const [rows, setRows] = useState<KeywordTrackerTransformed[]>([]);
  // [3] 전체 개수
  const totalCountRef = useRef(0);
  // [4] 현재 offset
  const offsetRef = useRef<number>(0);
  // [5] 추가로 로드할 수 있는지 여부
  const [hasNextPage, setHasNextPage] = useState(true);
  // [6] 로딩 중 상태
  const [isFetching, setIsFetching] = useState(false);
  // [7] 초기 로딩 상태
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // 엄격 모드
  const strictMode = useRecoilValue(strictModeState);
  const isFirstLoad = useRef(true);

  // Table states
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // 한 번에 가져올 개수
  const limit = 20;

  // [7] 서버 액션 호출 함수
  const loadNextPage = useCallback(async () => {
    if (!hasNextPage || isFetching) return; // 이미 로드 중이거나 다음 페이지가 없으면 실행 안 함
    setIsFetching(true);

    try {
      const result = await fetchKeywordTrackerWithResults({
        projectSlug,
        offset: offsetRef.current,
        limit,
        strictMode,
      });
      // result: { data, totalCount }
      setRows((prev) => [...prev, ...result.data]);

      // offset 갱신
      offsetRef.current += limit;

      // 더 이상 불러올 게 없으면 hasNextPage=false
      if (offsetRef.current >= totalCountRef.current) {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Failed to load next page:", error);
    } finally {
      setIsFetching(false);
      setIsInitialLoad(false);
    }
  }, [projectSlug, strictMode, isFetching, hasNextPage]);

  useEffect(() => {
    const initializeData = async () => {
      const count = await fetchTotalCount({ projectSlug });
      totalCountRef.current = count ?? 0;

      if (count > 0) {
        loadNextPage();
      }
    };

    if (isFirstLoad.current) {
      initializeData();
      isFirstLoad.current = false;
    }
  }, [loadNextPage, projectSlug]);

  const columns = useMemo(
    () => generateColumns(allDates, keywordCategories, projectSlug, readonly),
    [allDates, keywordCategories, projectSlug, readonly]
  );

  // Initialize the table
  const table = useReactTable({
    data: rows,
    columns,
    defaultColumn: {
      size: 100,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // manualSorting: true, // 서버 정렬
    // onSortingChange: handleSortingChange,
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // [11] 무한 스크롤 구현: 스크롤 위치 감지
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const { scrollHeight, scrollTop, clientHeight } = el;
      // 바닥에서 50px 이내면 다음 페이지 로드
      if (scrollHeight - scrollTop - clientHeight < 200) {
        // console.log("scroll fetching");
        loadNextPage();
      }
    },
    [loadNextPage]
  );

  // [12] 가상 스크롤
  // const rowVirtualizer = useVirtualizer({
  //   count: table.getRowModel().rows.length,
  //   getScrollElement: () => tableContainerRef.current,
  //   estimateSize: () => 40, // 각 행 높이 추정
  //   overscan: 5,
  // });

  if (isInitialLoad) {
    const columns = 4;
    const rows = 10;
    return (
      <div className="relative rounded-md border max-w-full overflow-hidden">
        <table className="table-auto w-full">
          {/* Table Header Skeleton */}
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-2">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body Skeleton */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
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
        ref={tableContainerRef}
        onScroll={onScroll}
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
            {rows.length && table.getRowModel().rows?.length
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
              : !isInitialLoad && (
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
