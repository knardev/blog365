import React from "react";
import { BlogAddSheet } from "@/features/blogs/components/blog-add-sheet";

export function BlogTableHeader({ profileId }: { profileId: string }) {
  return (
    <div className="flex items-center justify-end w-full gap-2 p-2">
      <BlogAddSheet profileId={profileId} />
    </div>
  );
}
