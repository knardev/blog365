import { ColumnDef } from "@tanstack/react-table";
import { BlogsWithAnalytics } from "@/features/blogs/types/types";

export function generateColumns(
  allDates: string[]
): ColumnDef<BlogsWithAnalytics>[] {
  // Static columns
  const staticColumns: ColumnDef<BlogsWithAnalytics>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center"
        >
          <p>별칭</p>
        </div>
      ),
      size: 100, // Fixed width
      meta: {
        sticky: true,
        isLastSticky: false,
        left: 0,
      },
    },
    {
      accessorKey: "blog_slug",
      header: ({ column }) => (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center"
        >
          <p>블로그 ID</p>
        </div>
      ),
      size: 150, // Fixed width
      meta: {
        sticky: true,
        isLastSticky: true,
        left: 100,
      },
    },
    // {
    //   accessorKey: "created_at",
    //   header: ({ column }) => (
    //     <div
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //       className="cursor-pointer flex items-center"
    //     >
    //       <p>작성일</p>
    //     </div>
    //   ),
    //   cell: ({ row }) => {
    //     const date = new Date(row.original.created_at);
    //     return new Intl.DateTimeFormat("ko-KR", {
    //       year: "numeric",
    //       month: "2-digit",
    //       day: "2-digit",
    //     }).format(date);
    //   },
    //   size: 150, // Fixed width
    // },
  ];

  // Dynamic columns based on dates
  const dynamicColumns: ColumnDef<BlogsWithAnalytics>[] = allDates.map(
    (date) => ({
      accessorFn: (row) => row.blog_analytics[date]?.daily_visitor ?? null,
      header: date,
      cell: ({ row }) => {
        const dailyVisitor = row.original.blog_analytics[date]?.daily_visitor;
        return dailyVisitor !== null ? dailyVisitor : "N/A";
      },
      size: 100,
      meta: {
        // sticky: true,
        // headerClassName: "w-[10px]", // min-width, taking
        // cellClassName: "w-[40px]", // fixed width
      },
    })
  );

  return [...staticColumns, ...dynamicColumns];
}
