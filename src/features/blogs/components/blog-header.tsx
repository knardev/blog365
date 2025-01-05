"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlogAddSheet } from "./blog-add-sheet";

export function BlogTableHeader({ profileId }: { profileId: string }) {
  const router = useRouter();

  // 버튼을 클릭하면 "?mode=add"를 쿼리에 추가하여 /blogs 페이지로 이동
  const handleAddButtonClick = () => {
    router.push("/blogs?mode=add");
  };

  return (
    <div className="flex items-center justify-end w-full gap-2 p-2">
      <Button variant="outline" size="sm" onClick={handleAddButtonClick}>
        + 블로그 추가
      </Button>
      <BlogAddSheet profileId={profileId} revalidateTargetPath="/blogs" />
    </div>
  );
}
