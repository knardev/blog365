"use client";

// hooks
import React, { useCallback, useEffect, useMemo } from "react";
import { useRecoilState, useResetRecoilState } from "recoil";
// states
import {
  blgoCardDataAtom,
  projectsBlogsAtom,
  visibleProjectsBlogsAtom,
} from "@/features/tracker/atoms/states";
// components
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProjectsBlogsCards } from "@/features/tracker/components/setting-panel/projects-blogs-cards";
// types
import { Blog } from "@/features/blogs/types/types";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { BlogCardData } from "@/features/tracker/atoms/states";

interface ProjectsBlogsSheetProps {
  projectSlug: string;
  // 유저가 소유하고 있는 모든 블로그
  initialAvailableBlogs: Blog[];
  // 유저가 소유하고 있는 블로그 중 프로젝트에 속한 블로그
  initialProjectsBlogs: ProjectsBlogsWithDetail[];
}

export function ProjectsBlogsSheet({
  projectSlug,
  initialAvailableBlogs,
  initialProjectsBlogs,
}: ProjectsBlogsSheetProps) {
  const [blogCardData, setBlogCardData] = useRecoilState(blgoCardDataAtom);
  const resetBlogCardData = useResetRecoilState(blgoCardDataAtom);

  const [projectBlogsState, setProjectBlogsState] =
    useRecoilState(projectsBlogsAtom);
  const resetProjectBlogsState = useResetRecoilState(projectsBlogsAtom);

  const [visibleProjectsBlogs, setVisibleProjectsBlogs] = useRecoilState(
    visibleProjectsBlogsAtom
  );

  // projectsBlogs는 서버 컴포넌트에서 넘어온 props 이기 때문에,
  // 컴포넌트가 마운트될 때 한번만 초기화됩니다.
  useEffect(() => {
    setProjectBlogsState(initialProjectsBlogs);
    // initialProjectsBlogs에서 active가 true인 블로그만 visibleProjectsBlogs에 추가합니다.
    setVisibleProjectsBlogs(initialProjectsBlogs.map((pb) => pb.blog_id));

    return () => {
      resetProjectBlogsState();
      resetBlogCardData();
    };
  }, [initialProjectsBlogs, resetProjectBlogsState, resetBlogCardData]);

  // projectBlogsState이 변경될 때마다 블로그 카드 데이터를 업데이트하여 ProjectsBlogsCards가 최신 데이터로 렌더링되도록 합니다.
  useEffect(() => {
    /**
     * 프로젝트에 속한 블로그와 사용자가 소유한 모든 블로그를 비교하여 블로그 카드 리스트를 생성합니다.
     * 이 카드 리스트는 프로젝트에 속한 블로그의 경우, 활성화 상태를 표시합니다.
     */
    const createBlogCardData = (
      projectBlogs: ProjectsBlogsWithDetail[],
      availableBlogs: Blog[]
    ): BlogCardData[] => {
      return availableBlogs
        .map((ab) => {
          const pb = projectBlogs.find((p) => p.blog_id === ab.id);
          return {
            id: ab.id,
            name: ab.name ?? "",
            blog_slug: ab.blog_slug,
            active: pb?.active ?? false,
          };
        })
        .sort((a, b) => Number(b.active) - Number(a.active)); // Active blogs first
    };

    // console.log("🔄 Updating blogCardData");
    // console.log(
    //   "👉 Current projectBlogs from ProjectBlogsCards:",
    //   projectBlogs
    // );
    // console.log(
    //   "👉 Current availableBlogs from ProjectBlogsCards:",
    //   initialAvailableBlogs
    // );
    setBlogCardData(
      createBlogCardData(projectBlogsState, initialAvailableBlogs)
    );
  }, [projectBlogsState, initialAvailableBlogs]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          추적 블로그 설정
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>추적 블로그 설정</SheetTitle>
          <SheetDescription>
            상위노출을 추적할 블로그를 설정하세요.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 mt-3 space-y-3 overflow-y-auto">
          <ProjectsBlogsCards projectSlug={projectSlug} />
        </div>
        <SheetFooter>
          <SheetClose asChild>{/* Save Button if needed */}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
