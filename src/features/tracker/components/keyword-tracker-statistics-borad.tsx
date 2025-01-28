"use client";

import React, { useState, useMemo, useEffect } from "react";
// components
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  RadialBarChart,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  Label,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
// actions
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
// utils
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";

interface KeywordTrackerStatisticsBoardProps {
  projectSlug: string;
  potentialExposureByDate: Record<string, number> | undefined;
  catchCountByDate: Record<string, number> | undefined;
  totalKeywords: number;
  todayCatchCount: number;
  readonly?: boolean;
}

export function KeywordTrackerStatisticsBoard({
  potentialExposureByDate,
  catchCountByDate,
  totalKeywords,
  todayCatchCount,
  readonly,
}: KeywordTrackerStatisticsBoardProps) {
  const today = getYesterdayInKST();
  const [timeRange, setTimeRange] = useState("7d");

  const potentialExposureData = useMemo(() => {
    const daysToSubtract = timeRange === "30d" ? 30 : 7;
    const todayKST = new Date(`${today}T09:00:00+09:00`);
    const startDateKST = new Date(todayKST);
    startDateKST.setDate(startDateKST.getDate() - daysToSubtract);

    if (!potentialExposureByDate) {
      return [];
    }

    return Object.keys(potentialExposureByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .filter((date) => {
        const dateInKST = new Date(`${date}T00:00:00+09:00`);
        return dateInKST >= startDateKST && dateInKST <= todayKST;
      })
      .map((date) => ({
        date,
        potentialExposure: potentialExposureByDate[date],
      }));
  }, [timeRange, potentialExposureByDate, today]);

  const catchCountData = useMemo(() => {
    const daysToSubtract = timeRange === "30d" ? 30 : 7;
    const todayKST = new Date(`${today}T09:00:00+09:00`);
    const startDateKST = new Date(todayKST);
    startDateKST.setDate(startDateKST.getDate() - daysToSubtract);

    if (!catchCountByDate) {
      return [];
    }

    return Object.keys(catchCountByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .filter((date) => {
        const currentDate = new Date(date);
        return currentDate >= startDateKST && currentDate <= todayKST;
      })
      .map((date) => ({
        date,
        caughtKeywords: catchCountByDate[date],
      }));
  }, [timeRange, catchCountByDate]);

  const radialData = useMemo(() => {
    const percentage = (todayCatchCount / totalKeywords) * 100;
    return [
      {
        totalKeywords: totalKeywords,
        percentage: percentage,
        todayCatchCount: todayCatchCount,
        fill: "hsl(var(--chart-1))",
      },
    ];
  }, [todayCatchCount, totalKeywords]);

  const radialChartConfig = {
    todayCatchCount: {
      label: "오늘 잡은 키워드",
    },
    percentage: {
      label: "오늘 성공률",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const areaChartConfig = {
    potentialExposure: {
      label: "노출량(명)",
      color: "hsl(var(--chart-1))",
    },
    caughtKeywords: {
      label: "잡은 키워드",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-9 gap-3">
      {/* Unified Select */}
      <div className="col-span-1 pl-1">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold">기간 선택</h4>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="최근 기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Radial Bar Chart */}
      <Card className="col-span-2 rounded-md">
        <CardHeader>
          <CardTitle>오늘 성공한 키워드</CardTitle>
          <CardDescription>전체 키워드 | {totalKeywords}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={radialChartConfig}
            className="mx-auto aspect-square max-h-[150px]"
          >
            <RadialBarChart
              data={radialData}
              innerRadius={60}
              outerRadius={90}
              startAngle={0}
              endAngle={0 + (360 * radialData[0].percentage) / 100} // Calculate end angle based on percentage
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[67, 52]}
              />
              <RadialBar background dataKey="todayCatchCount" />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-4xl font-bold"
                          >
                            {radialData[0].todayCatchCount.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            키워드
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Potential Exposure Area Chart */}
      <Card className="col-span-3 rounded-md">
        <CardHeader>
          <CardTitle>
            일별 예상 노출량 | 오늘{" "}
            {potentialExposureByDate
              ? potentialExposureByDate[today]
                ? potentialExposureByDate[today] + "명"
                : 0
              : 0}
          </CardTitle>
          <CardDescription>첫 페이지 예상 노출량을 보여줍니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="aspect-auto h-[150px] w-full"
            config={areaChartConfig}
          >
            <AreaChart data={potentialExposureData}>
              <defs>
                <linearGradient
                  id="fillPotentialExposure"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={areaChartConfig.potentialExposure.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={areaChartConfig.potentialExposure.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value.toLocaleString()}명`}
                domain={[0, "dataMax + 100"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                dataKey="potentialExposure"
                type="natural"
                fill="url(#fillPotentialExposure)"
                stroke={areaChartConfig.potentialExposure.color}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Caught Keywords Area Chart */}
      <Card className="col-span-3 rounded-md">
        <CardHeader>
          <CardTitle>
            일별 잡은 키워드 수 | 오늘{" "}
            {catchCountByDate
              ? catchCountByDate[today]
                ? catchCountByDate[today] + "개"
                : 0
              : 0}
          </CardTitle>
          <CardDescription>일별 잡힌 키워드 수를 보여줍니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="aspect-auto h-[150px] w-full"
            config={areaChartConfig}
          >
            <AreaChart data={catchCountData}>
              <defs>
                <linearGradient
                  id="fillCaughtKeywords"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={areaChartConfig.caughtKeywords.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={areaChartConfig.caughtKeywords.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value.toLocaleString()}개`}
                domain={[0, "dataMax"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                dataKey="caughtKeywords"
                type="natural"
                fill="url(#fillCaughtKeywords)"
                stroke={areaChartConfig.caughtKeywords.color}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
