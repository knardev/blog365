import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          블로그 설정
        </Button>
      </SheetTrigger>
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
        <SheetFooter>
          <SheetClose asChild>
            {/* <Button type="submit">Save changes</Button> */}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
