import { ColumnDef } from "@tanstack/react-table";
import { BlogsWithAnalytics } from "@/features/blogs/types/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

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
      size: 80, // Fixed width
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 0,
        isStickyRow: true,
        isLastSticky: false,
        isStickyMobileColumn: true,
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
      cell: ({ row }) => {
        const original = row.original;

        // 예시: original.isInfluencer를 기준으로 링크 분기
        const link = original.is_influencer
          ? `https://in.naver.com/${original.blog_slug}`
          : `https://blog.naver.com/${original.blog_slug}`;

        return (
          <div>
            <a href={link} target="_blank" rel="noreferrer">
              {original.blog_slug}
            </a>
          </div>
        );
      },
      size: 130, // Fixed width
      meta: {
        isStickyColumn: true,
        stickyColumnLeft: 80,
        isStickyRow: true,
        isLastSticky: true,
        isStickyMobileColumn: false,
      },
    },
  ];

  // Dynamic columns based on dates
  const dynamicColumns: ColumnDef<BlogsWithAnalytics>[] = allDates.map(
    (date) => ({
      accessorFn: (row) => row.blog_analytics[date]?.daily_visitor ?? 0,
      header: format(new Date(date), "MM/dd (EEE)", { locale: ko }),
      cell: ({ row }) => {
        const dailyVisitor =
          row.original.blog_analytics[date]?.daily_visitor ?? 0;
        return <div className="text-center select-none">{dailyVisitor}</div>;
      },
      size: 50,
      meta: {
        isStickyRow: true,
        isStickyColumn: false,
      },
    })
  );

  return [...staticColumns, ...dynamicColumns];
}
