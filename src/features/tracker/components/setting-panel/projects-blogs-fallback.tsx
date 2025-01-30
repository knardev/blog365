import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsBlogsFallback() {
  return (
    <div className="flex justify-between items-center">
      {/* Left Section */}
      <Skeleton className="h-6 w-32 rounded-md" />

      {/* Right Section - Buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
