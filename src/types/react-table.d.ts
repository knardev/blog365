import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    headerClassName?: string;
    cellClassName?: string;
    isStickyColumn?: boolean;
    stickyColumnLeft?: number;
    isStickyMobileColumn?: boolean;
    isStickyRow?: boolean;
    sticky?: boolean;
    left?: number;
    isLastSticky?: boolean;
  }
}
