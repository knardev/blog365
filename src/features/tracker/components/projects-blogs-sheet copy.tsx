"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProjectsBlogsCards } from "./projects-blogs-cards";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { Blog } from "@/features/blogs/types/types";

export function ProjectsBlogsSheet({
  blogs, // 기존 프로젝트에 등록된 블로그들
  availableBlogs, // 전체 블로그 리스트
  projectSlug,
}: {
  blogs: ProjectsBlogsWithDetail[];
  availableBlogs: Blog[];
  projectSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?mode=blog 일 때 Sheet를 열기
  const mode = searchParams.get("mode");
  const isOpen = mode === "blog";

  // Sheet를 닫을 때 쿼리 파라미터에서 mode 제거
  const handleCloseSheet = () => {
    router.replace(`/${projectSlug}/tracker`);
  };

  // 버튼 클릭 시 ?mode=blog 추가 → Sheet 오픈
  const handleAddButtonClick = () => {
    router.push(`/${projectSlug}/tracker?mode=blog`);
  };

  return (
    <>
      {/* 1) + 블로그 추가 버튼: 클릭 시 쿼리 파라미터를 추가하여 이동 */}
      <Button variant="outline" size="sm" onClick={handleAddButtonClick}>
        + 블로그 추가
      </Button>

      {/* 2) Sheet: open={isOpen}로 제어 */}
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          // Sheet가 닫히면 쿼리 파라미터 제거
          if (!open) {
            handleCloseSheet();
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>추적 블로그 설정</SheetTitle>
            <SheetDescription>
              상위노출을 추적할 블로그를 설정하세요.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3 space-y-3">
            {/* 블로그 목록을 카드 형태로 모두 출력 */}
            <ProjectsBlogsCards
              projectBlogs={blogs}
              availableBlogs={availableBlogs}
              projectSlug={projectSlug}
            />
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </>
  );
}
