import { ColumnDef } from "@tanstack/react-table";
import { KeywordTrackerWithAnalytics } from "@/features/keyword/types/types";
import { KeywordCategories } from "@/features/tracker/queries/define-fetch-keyword-categories";

import { Check, ChevronsUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { CategorySelector } from "@/features/keyword/components/category-selector";
import { ActiveSwitch } from "@/features/keyword/components/active-switch";

export function generateColumns(
  keywordCategories: KeywordCategories[],
  projectSlug: string
): ColumnDef<KeywordTrackerWithAnalytics>[] {
  return [
    // Column for Keyword Name
    {
      accessorKey: "keywords.name",
      header: "키워드",
      size: 200,
    },

    {
      accessorKey: "keyword_categories.name",
      header: "카테고리",
      size: 250,
      cell: ({ row }) => {
        const tracker = row.original;
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
    },

    // Column for Monthly Search Volume
    {
      accessorKey: "keyword_analytics.montly_search_volume",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          월 검색량
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      size: 150,
      cell: ({ row }) => {
        const value = row.original.keyword_analytics?.montly_search_volume;
        return value !== undefined ? value : "N/A";
      },
    },

    // Column for Daily Search Volume
    {
      accessorKey: "keyword_analytics.daily_search_volume",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          일 검색량
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      size: 150,
      cell: ({ row }) => {
        const value = row.original.keyword_analytics?.daily_search_volume;
        return value !== undefined ? value : "N/A";
      },
    },

    // Column for Monthly Issue Volume
    {
      accessorKey: "keyword_analytics.montly_issue_volume",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          월 발행량
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </div>
      ),
      size: 150,
      cell: ({ row }) => {
        const value = row.original.keyword_analytics?.montly_issue_volume;
        return value !== undefined ? value : "N/A";
      },
    },

    // Column for Honey Index
    {
      accessorKey: "keyword_analytics.honey_index",
      header: "꿀지수",
      size: 150,
      cell: ({ row }) => {
        const value = row.original.keyword_analytics?.honey_index;
        return value !== undefined ? value : "N/A";
      },
    },

    // Column for Active Switch
    {
      accessorKey: "active",
      header: "추적 활성화",
      size: 100,
      cell: ({ row }) => {
        const tracker = row.original;
        return (
          <ActiveSwitch
            trackerId={tracker.id}
            isActive={tracker.active}
            projectSlug={projectSlug}
          />
        );
      },
    },
  ];
}
