// generateColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { KeywordTrackerWithResults } from "@/features/tracker/types/types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/**
 * Generate columns for KeywordTrackerWithResults table
 * @param allDates - Array of all dates to create dynamic columns
 * @returns Array of ColumnDef
 */
export function generateColumns(
  allDates: string[]
): ColumnDef<KeywordTrackerWithResults>[] {
  // Static columns
  const staticColumns: ColumnDef<KeywordTrackerWithResults>[] = [
    {
      accessorKey: "keywords.name",
      header: ({ column }) => (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center"
        >
          <p>키워드</p>
        </div>
      ),
      size: 100,
      meta: {
        sticky: true,
        isLastSticky: false,
        left: 0,
      },
    },
    {
      accessorKey: "keyword_categories.name",
      header: ({ column }) => (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center"
        >
          <p>카테고리</p>
        </div>
      ),
      size: 100,
      meta: {
        sticky: true,
        isLastSticky: false,
        left: 100,
      },
    },
    {
      accessorKey: "keyword_analytics.montly_search_volume",
      header: ({ column }) => (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center"
        >
          <p>월간 검색량</p>
        </div>
      ),
      size: 100,
      meta: {
        sticky: true,
        isLastSticky: true,
        left: 200,
      },
    },
    // more static columns...
  ];

  // Dynamic columns based on dates
  const dynamicColumns: ColumnDef<KeywordTrackerWithResults>[] = allDates.map(
    (date) => ({
      accessorFn: (row) =>
        row.keyword_tracker_results[date]?.catch_success ?? null,
      header: date,
      cell: ({ row, getValue }) => {
        const catchSuccess = getValue() as number | null;
        const catchResult =
          row.original.keyword_tracker_results[date]?.catch_result;

        if (catchSuccess === null) {
          return (
            <div
              className={`w-full cursor-pointer text-white bg-red-500 rounded`}
            >
              {0}
            </div>
          );
        }
        return (
          <div
            className={`w-full cursor-pointer text-white ${
              catchSuccess > 0 ? "bg-green-500" : "bg-red-500"
            } rounded`}
          >
            {catchSuccess}
          </div>
        );
        // return (
        //   <HoverCard>
        //     <HoverCardTrigger asChild>
        //       <div
        //         className={`w-full cursor-pointer text-white ${
        //           catchSuccess > 0 ? "bg-green-500" : "bg-red-500"
        //         } rounded`}
        //       >
        //         {catchSuccess}
        //       </div>
        //     </HoverCardTrigger>
        //     {catchResult && catchResult.length > 0 && (
        //       <HoverCardContent className="w-80">
        //         <div className="space-y-2">
        //           {catchResult.map((result, index) => (
        //             <div key={index} className="flex flex-col">
        //               <a
        //                 href={result.post_url}
        //                 target="_blank"
        //                 rel="noopener noreferrer"
        //                 className="text-blue-500 underline"
        //               >
        //                 {result.post_url}
        //               </a>
        //               <span>순위: {result.rank_in_smart_block}</span>
        //             </div>
        //           ))}
        //         </div>
        //       </HoverCardContent>
        //     )}
        //   </HoverCard>
        // );
      },
      size: 100,
      meta: {
        sticky: false,
      },
    })
  );

  return [...staticColumns, ...dynamicColumns];
}
