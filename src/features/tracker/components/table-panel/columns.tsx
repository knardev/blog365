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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { KeywordTrackerTransformed } from "@/features/tracker/types/types";
import { CategorySelector } from "@/features/tracker/components/table-panel/category-selector";
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
      id: "keywords.name",
      accessorKey: "keywords.name",
      header: ({ column }) => <SortableHeader column={column} title="키워드" />,
      cell: ({ row }) => (
        <KeywordCell
          keywords={row.original.keywords}
          readonly={readonly} // Pass the readonly flag as needed
          trackerId={row.original.id} // Pass the tracker ID for deletion
        />
      ),
      enableMultiSort: true,
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 0,
        isStickyRow: true,
        isStickyMobileColumn: true,
      },
    },
    {
      id: "keyword_categories.name",
      accessorKey: "keyword_categories.name",
      header: ({ column }) => (
        <SortableHeader column={column} title="카테고리" isMulti />
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
      enableMultiSort: true,
      size: 85,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 100,
        isStickyRow: true,
      },
    },
    {
      id: "keyword_analytics.montly_search_volume",
      accessorKey: "keyword_analytics.montly_search_volume",
      header: ({ column }) => (
        <SortableHeader column={column} title="월 검색량" isMulti />
      ),
      cell: ({ row }) => {
        const analytics = row.original.keyword_analytics;
        const chartData = [
          {
            month: "월 검색량",
            desktop: analytics?.montly_pc_search_volume || 0,
            mobile: analytics?.montly_mobile_search_volume || 0,
          },
        ];
        const totalSearchVolume = chartData[0].desktop + chartData[0].mobile;

        return (
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="text-center cursor-pointer">
                {formatNumber(analytics?.montly_search_volume)}
              </div>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent
                className="w-60 max-h-[150px] p-2"
                side="right"
                sideOffset={-10}
              >
                <ChartContainer
                  className="mx-auto aspect-square w-full max-w-[250px]"
                  config={{
                    desktop: { label: "PC", color: "hsl(var(--chart-1))" },
                    mobile: { label: "모바일", color: "hsl(var(--chart-2))" },
                  }}
                >
                  <RadialBarChart
                    data={chartData}
                    endAngle={180}
                    innerRadius={70}
                    outerRadius={120}
                  >
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <PolarRadiusAxis
                      tick={false}
                      tickLine={false}
                      axisLine={false}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 16}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {totalSearchVolume.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 4}
                                  className="fill-muted-foreground"
                                >
                                  검색량
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </PolarRadiusAxis>
                    <RadialBar
                      dataKey="desktop"
                      stackId="a"
                      cornerRadius={5}
                      fill="hsl(var(--chart-1))"
                      className="stroke-transparent stroke-2"
                    />
                    <RadialBar
                      dataKey="mobile"
                      fill="hsl(var(--chart-2))"
                      stackId="a"
                      cornerRadius={5}
                      className="stroke-transparent stroke-2"
                    />
                  </RadialBarChart>
                </ChartContainer>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        );
      },
      enableSorting: true,
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 185,
        isStickyRow: true,
      },
    },
    {
      id: "keyword_analytics.montly_issue_volume",
      accessorKey: "keyword_analytics.montly_issue_volume",
      header: ({ column }) => (
        <SortableHeader column={column} title="월 발행량" />
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
                        월 발행량
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_issue_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily`}>
                      <TableCell className="font-medium text-xs">
                        일 발행량
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
      enableSorting: true,
      size: 100,
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 285,
        isStickyRow: true,
      },
    },
    {
      id: "keyword_analytics.daily_first_page_exposure",
      accessorKey: "keyword_analytics.daily_first_page_exposure",
      header: ({ column }) => (
        <SortableHeader column={column} title="일 노출량" />
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
    /*{
      accessorKey: "keyword_analytics.montly_search_volume",
      header: ({ column }) => (
        <SortableHeader column={column} title="월 검색량" />
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
                        월 PC
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_pc_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-month-mo`}>
                      <TableCell className="font-medium text-xs">
                        월 모바일
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.montly_mobile_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily-pc`}>
                      <TableCell className="font-medium text-xs">
                        일 PC
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatNumber(analytics?.daily_pc_search_volume)}
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${analytics?.id}-daily-mo`}>
                      <TableCell className="font-medium text-xs">
                        일 모바일
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
    },*/
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
