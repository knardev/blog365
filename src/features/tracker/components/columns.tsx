"use client";

// columns.tsx
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
  HoverCardArrow,
} from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  SortableHeader,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { KeywordTrackerTransformed } from "@/features/tracker/types/types";
import { CategorySelector } from "@/features/tracker/components/category-selector";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import { KeywordCell } from "./keyword-cell";

/**
 * 숫자를 3자리 단위로 콤마를 찍어주는 유틸 함수
 */
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value.toLocaleString("ko-KR");
}

/**
 * Generate columns for KeywordTrackerWithResults table
 * @param allDates - Array of all dates to create dynamic columns
 * @returns Array of ColumnDef
 */
export function generateColumns(
  allDates: string[],
  keywordCategories: KeywordCategories,
  projectSlug: string,
  readonly: boolean = false
): ColumnDef<KeywordTrackerTransformed>[] {
  // Static columns
  const staticColumns: ColumnDef<KeywordTrackerTransformed>[] = [
    {
      accessorKey: "keywords.name",
      header: ({ column }) => <SortableHeader column={column} title="키워드" />,
      cell: ({ row }) => (
        <KeywordCell
          keywords={row.original.keywords}
          readonly={readonly} // Pass the readonly flag as needed
          trackerId={row.original.id} // Pass the tracker ID for deletion
        />
      ),
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 0,
        isStickyRow: true,
        isStickyMobileColumn: true,
      },
    },
    {
      accessorKey: "keyword_categories.name",
      header: ({ column }) => (
        <SortableHeader column={column} title="카테고리" />
      ),
      cell: ({ row }) => {
        const tracker = row.original;
        if (readonly) {
          return (
            <div className="text-center">
              {tracker.keyword_categories?.name}
            </div>
          );
        }
        return (
          <CategorySelector
            trackerId={tracker.id}
            currentCategoryId={tracker.keyword_categories?.id || null}
            currentCategoryName={tracker.keyword_categories?.name || null}
            keywordCategories={keywordCategories}
            projectSlug={projectSlug}
          />
        );
      },
      size: 85,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 100,
        isStickyRow: true,
      },
    },
    {
      accessorKey: "keyword_analytics.montly_search_volume",
      header: ({ column }) => (
        <SortableHeader column={column} title="월간 검색량" />
      ),
      cell: ({ row }) => {
        const analytics = row.original.keyword_analytics;
        return (
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="text-center cursor-pointer">
                {formatNumber(analytics?.montly_search_volume)}
              </div>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent className="w-40" side="right" sideOffset={-10}>
                <h4 className="font-bold text-sm">상세데이터</h4>
                <Table>
                  <TableBody>
                    <TableRow key={`${analytics?.id}-month-pc`}>
                      <TableCell className="font-medium text-xs">
                        월간 PC
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_pc_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-month-mo`}>
                      <TableCell className="font-medium text-xs">
                        월간 모바일
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_mobile_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily-pc`}>
                      <TableCell className="font-medium text-xs">
                        일간 PC
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.daily_pc_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily-mo`}>
                      <TableCell className="font-medium text-xs">
                        일간 모바일
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.daily_mobile_search_volume)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <HoverCardArrow className="fill-destructive" />
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        );
      },
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 185,
        isStickyRow: true,
      },
    },
    {
      accessorKey: "keyword_analytics.montly_issue_volume",
      header: ({ column }) => (
        <SortableHeader column={column} title="월간 발행량" />
      ),
      cell: ({ row }) => {
        const analytics = row.original.keyword_analytics;
        return (
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="text-center cursor-pointer text-sm">
                {formatNumber(analytics?.montly_issue_volume)}
              </div>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent className="w-40" side="right" sideOffset={-10}>
                <h4 className="font-bold text-sm">상세데이터</h4>
                <Table>
                  <TableBody>
                    <TableRow key={`${analytics?.id}-month`}>
                      <TableCell className="font-medium text-xs">
                        월간 발행량
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_issue_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily`}>
                      <TableCell className="font-medium text-xs">
                        일간 발행량
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.daily_issue_volume)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <HoverCardArrow className="fill-destructive" />
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        );
      },
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 285,
        isStickyRow: true,
      },
    },
    {
      accessorKey: "keyword_analytics.daily_first_page_exposure",
      header: ({ column }) => (
        <SortableHeader column={column} title="일간 노출량" />
      ),
      cell: ({ row }) => {
        const analytics = row.original.keyword_analytics;
        return (
          <div className="text-center select-none">
            {formatNumber(analytics?.daily_first_page_exposure)}
          </div>
        );
      },
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 385,
        isStickyRow: true,
        isLastSticky: true,
      },
    },
    // more static columns...
  ];

  // Dynamic columns based on dates
  const dynamicColumns: ColumnDef<KeywordTrackerTransformed>[] = allDates.map(
    (date) => ({
      id: date,
      accessorFn: (row) =>
        row.keyword_tracker_results[date]?.catch_success ?? null,
      header: ({ column }) => (
        <SortableHeader
          column={column}
          title={format(new Date(date), "MM/dd (EEE)", { locale: ko })}
          shoWIcon={false}
        />
      ),
      cell: ({ row, getValue }) => {
        const catchSuccess = getValue() as number | null;
        const catchResult =
          row.original.keyword_tracker_results[date]?.catch_result;
        if (catchSuccess === null)
          return <div className="text-center select-none">{0}</div>;
        return (
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="select-none text-center">{catchSuccess ?? 0}</div>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent className="w-48" side="right" sideOffset={-5}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs">스마트블럭</div>
                  <div className="font-bold text-xs">순위</div>
                </div>
                {catchResult?.map((result, index) => (
                  <div
                    key={`${result.post_url}-${index}`}
                    className="flex items-center justify-between mb-1"
                  >
                    <div className="font-medium text-xs">
                      <a
                        href={result.post_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {result.smart_block_name}
                      </a>
                    </div>
                    <div className="font-semibold text-sm">
                      {result.rank_in_smart_block}
                    </div>
                  </div>
                ))}
                <HoverCardArrow className="fill-destructive" />
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        );
      },
      size: 50,
      meta: {
        isStickyColumn: false,
        isStickyRow: true, // 헤더 자체
      },
    })
  );

  return [...staticColumns, ...dynamicColumns];
}
