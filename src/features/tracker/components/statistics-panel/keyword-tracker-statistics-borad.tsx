"use client";

// hooks
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
// atoms
import {
  strictModeAtom,
  visibleProjectsBlogsAtom,
  trackerStatisticsAtom,
} from "@/features/tracker/atoms/states";
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
import {
  BaseMultiSelector,
  Option,
} from "@/components/custom-ui/base-multi-select";
// utils
import { getTodayInKST, getYesterdayInKST } from "@/utils/date";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import {
  MergedDataRow,
  KeywordTrackerTransformed,
  DailyResult,
} from "@/features/tracker/types/types";

interface KeywordTrackerStatisticsBoardProps {
  projectSlug: string;
  initialTrackerData: MergedDataRow[];
  keywordCategories: KeywordCategories;
  readonly?: boolean;
}

export function KeywordTrackerStatisticsBoard({
  projectSlug,
  initialTrackerData,
  keywordCategories,
  readonly = false,
}: KeywordTrackerStatisticsBoardProps) {
  const [trackerStatistics, setTrackerStatistics] = useRecoilState(
    trackerStatisticsAtom
  );

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
    () => transformTrackerData(initialTrackerData),
    [initialTrackerData, transformTrackerData]
  );

  // store to Recoil if needed, or you can simply use `transformed`:
  useEffect(() => {
    // If you truly need to store the transformed data in Recoil, do it once here:
    setTrackerStatistics(transformed);
  }, [transformed, setTrackerStatistics]);

  const today = getTodayInKST();
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const categoryOptions = useMemo<Option[]>(() => {
    if (!keywordCategories) return [];
    return keywordCategories.map((cat) => ({
      value: cat.name ?? "",
      label: cat.name ?? "",
    }));
  }, [keywordCategories]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  /**
   * 1) Filter trackers by category (if a category is selected).
   *    This assumes you have some category info in your `transformedData`.
   */
  const filteredTrackers = useMemo(() => {
    // If no category is selected, return all trackers
    if (selectedCategories.length === 0) return trackerStatistics;

    return trackerStatistics.filter((item) => {
      // Ensure item.keyword_categories is not null
      if (!item.keyword_categories?.name) return false;

      // Check if this tracker belongs to any selected category
      return selectedCategories.includes(item.keyword_categories.name);
    });
  }, [trackerStatistics, selectedCategories]);

  /**
   * 2) Compute potentialExposureByDate & catchCountByDate from filtered trackers.
   */
  const { potentialExposureByDate, catchCountByDate } = useMemo(() => {
    const _potentialExposureByDate: Record<string, number> = {};
    const _catchCountByDate: Record<string, number> = {};

    filteredTrackers.forEach((tracker) => {
      const dailySearchVolume =
        tracker.keyword_analytics?.daily_search_volume ?? 0;

      Object.entries(tracker.keyword_tracker_results).forEach(
        ([date, result]) => {
          // (A) Calculate daily exposure
          const dailyExposure = (result.catch_success ?? 0) * dailySearchVolume;
          _potentialExposureByDate[date] =
            (_potentialExposureByDate[date] ?? 0) + dailyExposure;

          // (B) Calculate catch count
          if ((result.catch_success ?? 0) > 0) {
            _catchCountByDate[date] = (_catchCountByDate[date] ?? 0) + 1;
          }
        }
      );
    });

    return {
      potentialExposureByDate: _potentialExposureByDate,
      catchCountByDate: _catchCountByDate,
    };
  }, [filteredTrackers]);

  /**
   * 3) For example, we can determine today's catch count from catchCountByDate
   *    (You can also incorporate your time range logic if desired.)
   */
  const todayCatchCount = catchCountByDate[today] ?? 0;

  /**
   * 4) Then you can generate the final data for your charts based on `timeRange`.
   */
  const potentialExposureData = useMemo(() => {
    if (!potentialExposureByDate) return [];
    // for example 7d or 30d back
    const daysToSubtract = timeRange === "30d" ? 30 : 7;
    const now = new Date(`${today}T09:00:00+09:00`);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return Object.keys(potentialExposureByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .filter((date) => {
        const dateObj = new Date(`${date}T09:00:00+09:00`);
        return dateObj >= startDate && dateObj <= now;
      })
      .map((date) => ({
        date,
        potentialExposure: potentialExposureByDate[date],
      }));
  }, [timeRange, potentialExposureByDate, today]);

  const catchCountData = useMemo(() => {
    if (!catchCountByDate) return [];
    const daysToSubtract = timeRange === "30d" ? 30 : 7;
    const now = new Date(`${today}T09:00:00+09:00`);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return Object.keys(catchCountByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .filter((date) => {
        const dateObj = new Date(`${date}T09:00:00+09:00`);
        return dateObj >= startDate && dateObj <= now;
      })
      .map((date) => ({
        date,
        caughtKeywords: catchCountByDate[date],
      }));
  }, [timeRange, catchCountByDate, today]);

  // 7) Radial data: reflect the filtered trackers only
  //    i.e., fraction of filtered trackers that we "caught" today
  const radialData = useMemo(() => {
    const filteredTotal = filteredTrackers.length; // denominator
    const filteredToday = todayCatchCount; // numerator
    const percentage =
      filteredTotal > 0 ? (filteredToday / filteredTotal) * 100 : 0;

    return [
      {
        totalKeywords: filteredTotal, // total in the filtered set
        todayCatchCount: filteredToday,
        percentage,
        fill: "hsl(var(--chart-1))",
      },
    ];
  }, [filteredTrackers, todayCatchCount]);

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
          <h4 className="text-sm font-bold">그래프 설정</h4>
          <Select
            value={timeRange}
            onValueChange={(value: "7d" | "30d") => setTimeRange(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="최근 기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
            </SelectContent>
          </Select>
          <BaseMultiSelector
            options={categoryOptions}
            values={selectedCategories} // the array of selected category slugs
            onValuesChange={(newValues) => setSelectedCategories(newValues)}
            placeholder="카테고리 선택"
            maxBadges={1}
            width="w-[120px]"
          />
        </div>
      </div>

      {/* Radial Bar Chart */}
      <Card className="col-span-2 rounded-md">
        <CardHeader>
          <CardTitle>오늘 성공한 키워드</CardTitle>
          <CardDescription>
            전체 키워드 | {radialData[0].totalKeywords}
          </CardDescription>
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
