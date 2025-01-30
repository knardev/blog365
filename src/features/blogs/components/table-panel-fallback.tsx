import { Skeleton } from "@/components/ui/skeleton";

export function TablePanelFallback() {
  const columns = 4;
  const rows = 10;
  return (
    <div className="relative rounded-md border max-w-full overflow-hidden">
      <table className="table-auto w-full">
        {/* Table Header Skeleton */}
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-2">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body Skeleton */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-2">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
