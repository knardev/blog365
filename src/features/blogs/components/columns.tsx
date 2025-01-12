import { ColumnDef } from "@tanstack/react-table";
import { BlogsWithAnalytics } from "@/features/blogs/types/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SortableHeader } from "@/components/ui/table";

export function generateColumns(
  allDates: string[]
): ColumnDef<BlogsWithAnalytics>[] {
  // Static columns
  const staticColumns: ColumnDef<BlogsWithAnalytics>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="별칭" />,
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
        <SortableHeader column={column} title="블로그 ID" />
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
        isLastSticky: false,
        isStickyMobileColumn: false,
      },
    },
    {
      accessorKey: "average_daily_visitors_7_days",
      header: ({ column }) => (
        <SortableHeader column={column} title="최근 7일 평균" />
      ),
      cell: ({ row }) => {
        const avg7Days = row.original.average_daily_visitors_7_days ?? 0;
        return <div className="text-center select-none">{avg7Days}</div>;
      },
      size: 120, // Fixed width
      meta: {
        stickyColumnLeft: 210,
        isStickyColumn: true,
        isStickyRow: true,
        isLastSticky: false,
        isStickyMobileColumn: false,
      },
    },
    {
      accessorKey: "average_daily_visitors_1_month",
      header: ({ column }) => (
        <SortableHeader column={column} title="최근 한 달 평균" />
      ),
      cell: ({ row }) => {
        const avg1Month = row.original.average_daily_visitors_1_month ?? 0;
        return <div className="text-center select-none">{avg1Month}</div>;
      },
      size: 120, // Fixed width
      meta: {
        stickyColumnLeft: 330,
        isStickyColumn: true,
        isLastSticky: true,
        isStickyRow: true,
        isStickyMobileColumn: false,
      },
    },
  ];

  // Dynamic columns based on dates
  const dynamicColumns: ColumnDef<BlogsWithAnalytics>[] = allDates.map(
    (date) => ({
      id: date,
      accessorFn: (row) => row.blog_analytics[date]?.daily_visitor ?? 0,
      header: ({ column }) => (
        <SortableHeader
          column={column}
          title={format(new Date(date), "MM/dd (EEE)", { locale: ko })}
          shoWIcon={false}
        />
      ),
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
