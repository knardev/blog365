"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // Link 불러오기
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

  // 쿼리 파라미터에서 mode 값을 가져와서 Sheet 열릴지 결정
  const mode = searchParams.get("mode");
  const isOpen = mode === "blog";

  // Sheet가 닫힐 때
  const handleCloseSheet = () => {
    router.replace(`/${projectSlug}/tracker`);
  };

  return (
    <>
      {/* Link를 사용해 ?mode=blog로 이동, prefetch=true로 설정 */}
      <Link href={`/${projectSlug}/tracker?mode=blog`} prefetch>
        <Button variant="outline" size="sm">
          + 블로그 추가
        </Button>
      </Link>

      {/* Sheet는 ?mode=blog인 경우만 열림 */}
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
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
            {/* 블로그 목록 출력 */}
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
