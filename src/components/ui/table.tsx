import * as React from "react";

import { cn } from "@/utils/shadcn/utils";
import { Column } from "@tanstack/react-table";
import { ChevronsUpDown, ArrowDown, ArrowUp } from "lucide-react";

function getStickyZIndex(
  isStickyRow?: boolean,
  isStickyColumn?: boolean,
  isStickyMobileColumn?: boolean
) {
  if (isStickyRow && isStickyMobileColumn && isStickyColumn) return "z-40";
  if (isStickyRow && isStickyColumn) return "z-30";
  if (isStickyRow) return "z-20";
  if (isStickyColumn) return "z-10";
  return "z-0";
}

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("table-fixed min-w-max caption-bottom text-sm", className)}
    {...props}
  />
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    width?: string;
    isStickyColumn?: boolean;
    stickyColumnLeft?: number;
    isStickyRow?: boolean;
    isStickyMobileColumn?: boolean;
    isLastSticky?: boolean;
  }
>(
  (
    {
      className,
      width,
      isStickyColumn = false,
      stickyColumnLeft = 0,
      isStickyRow = false,
      isStickyMobileColumn = false,
      isLastSticky = false,
      ...props
    },
    ref
  ) => {
    // 1) 화면 너비에 따라 모바일 여부 판단
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      function handleResize() {
        setIsMobile(window.innerWidth < 768);
      }
      handleResize(); // 초기 판단
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const zIndexClass = getStickyZIndex(
      isStickyRow,
      isStickyColumn,
      isStickyMobileColumn
    );

    // 기본 클래스
    const computedClasses = [
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground",
      "overflow-hidden text-ellipsis whitespace-nowrap",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] bg-muted",
    ];

    // 1) 행 스티키
    if (isStickyRow) {
      computedClasses.push("sticky bg-muted top-0");
    }
    // 2) 열 스티키 (md 이상)
    if (isStickyColumn) {
      computedClasses.push("md:sticky md:bg-muted");
    }

    // 3) 모바일 열 스티키 (sm 이하)
    //    단, 행 스티키나 열 스티키가 이미 true이면 무시
    if (!isStickyRow && !isStickyColumn && isStickyMobileColumn) {
      computedClasses.push(
        "sticky bg-muted left-0 md:static md:relative md:bg-inherit"
      );
    }

    // 4) 마지막 열 테두리 (예시)
    if (isLastSticky) {
      computedClasses.push("md:border-r");
    }

    // 최종 클래스
    const finalClassName = cn(computedClasses, zIndexClass, className);

    // 스타일: left 적용
    //  - 열 스티키이거나 (md 이상), 모바일 열 스티키가 유효한 경우에만 적용
    let leftValue: string | undefined;
    if (isStickyColumn && !isStickyMobileColumn) {
      if (!isMobile) {
        leftValue = `${stickyColumnLeft}px`;
      } else {
        leftValue = undefined;
      }
    }
    if (isStickyColumn && isStickyMobileColumn) {
      leftValue = `${stickyColumnLeft}px`;
    }

    return (
      <th
        ref={ref}
        className={finalClassName}
        style={{
          width: width ? `${width}` : undefined,
          left: leftValue,
        }}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    width?: string;
    isStickyColumn?: boolean;
    isStickyRow?: boolean;
    stickyColumnLeft?: number;
    isStickyMobileColumn?: boolean;
    isLastSticky?: boolean;
    left?: string;
    backgroundColor?: string;
  }
>(
  (
    {
      className,
      isStickyColumn,
      isStickyRow,
      stickyColumnLeft,
      isStickyMobileColumn = false,
      isLastSticky,
      width,
      left,
      backgroundColor,
      ...props
    },
    ref
  ) => {
    const zIndexClass = getStickyZIndex(false, isStickyColumn);

    return (
      <td
        ref={ref}
        className={cn(
          "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-ellipsis whitespace-nowrap overflow-visible hover:bg-muted",
          (isStickyColumn || isStickyRow) && "md:sticky md:bg-background",
          isStickyMobileColumn && "sticky bg-background",
          isStickyRow && "top-0",
          isLastSticky && "md:border-r",
          zIndexClass,
          className
        )}
        style={{
          backgroundColor: backgroundColor
            ? `${backgroundColor}`
            : "hsl(var(--background))",
          width: width ? `${width}` : undefined,
          left: `${stickyColumnLeft}px`,
        }}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>; // Accepts a column object directly
  title: string; // The title to display in the header
}

const SortableHeader = <TData,>({
  column,
  title,
}: SortableHeaderProps<TData>) => {
  const isSorted = column.getIsSorted(); // "asc", "desc", or false

  const handleSorting = () => {
    // Check the current sorting state
    console.log(column.getIsSorted());
    if (column.getIsSorted() === "desc") {
      column.toggleSorting(false); // Switch to "asc"
    } else if (column.getIsSorted() === "asc") {
      column.clearSorting(); // Remove sorting
    } else {
      column.toggleSorting(true); // Switch to "desc"
    }
  };

  return (
    <div className="flex items-center cursor-pointer" onClick={handleSorting}>
      {title}
      {isSorted === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="ml-1 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  SortableHeader,
};
