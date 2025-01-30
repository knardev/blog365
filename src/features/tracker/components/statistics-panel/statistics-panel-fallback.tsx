import { Skeleton } from "@/components/ui/skeleton";

export function StatisticsPanelFallback() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[266px]">
      {/* Card 1 */}
      <div className="border rounded-lg p-4 shadow-sm bg-background">
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>

      {/* Card 2 */}
      <div className="border rounded-lg p-4 shadow-sm bg-background">
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>

      {/* Card 3 */}
      <div className="border rounded-lg p-4 shadow-sm bg-background">
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    </div>
  );
}
