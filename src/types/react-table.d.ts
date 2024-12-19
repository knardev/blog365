import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    headerClassName?: string;
    cellClassName?: string;
    sticky?: boolean;
    left?: number;
    isLastSticky?: boolean;
  }
}