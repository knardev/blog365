"use client";

// hooks
import React, { useState, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
// states
import {
  blgoCardDataAtom,
  projectsBlogsAtom,
} from "@/features/tracker/atoms/states";
// components
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
// actions
import { addProjectsBlogs } from "@/features/tracker/actions/add-projects-blogs";
import { updateProjectsBlogs } from "@/features/tracker/actions/update-projects-blogs";
// types

interface ProjectsBlogsCardsProps {
  projectSlug: string;
}

export function ProjectsBlogsCards({ projectSlug }: ProjectsBlogsCardsProps) {
  const [blogCardData, setBlogCardData] = useRecoilState(blgoCardDataAtom);
  const [projectsBlogsState, setProjectBlogsState] =
    useRecoilState(projectsBlogsAtom);

  // ---------- 현재 토글 중인 blogId를 추적하기 위한 상태 ----------
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const router = useRouter();

  const setLoading = (blogId: string, isLoading: boolean) => {
    setLoadingIds((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(blogId);
      } else {
        newSet.delete(blogId);
      }
      return newSet;
    });
  };

  /**
   * 블로그의 추적 활성화(ON) / 비활성화(OFF)를 토글하는 함수 (Optimistic)
   */
  const handleToggleActive = async (blogId: string, newActive: boolean) => {
    // 1) 먼저 UI에서 곧바로 active 상태를 업데이트 (optimistic)
    setBlogCardData((prev) =>
      prev.map((blog) =>
        blog.id === blogId ? { ...blog, active: newActive } : blog
      )
    );

    // 2) 지금 토글 중인 blogId를 로딩 상태로 표시 (해당 스위치만 disabled)
    setLoading(blogId, true);

    try {
      // 이미 프로젝트에 등록된 블로그인지 확인
      const existingProjectBlog = projectsBlogsState.find(
        (pb) => pb.blog_id === blogId
      );

      // 등록된 적 없는 블로그인데 스위치를 ON → addProjectsBlogs
      if (!existingProjectBlog) {
        if (newActive) {
          const newProjectBlog = await addProjectsBlogs(projectSlug, blogId);
          if (newProjectBlog) {
            // ProjectsBlogsSheet의 useCallback을 실행하여, blogCardData를 업데이트한다.
            setProjectBlogsState((prev) => [...prev, newProjectBlog[0]]);
          }
        }
      }
      // 이미 등록된 블로그 → updateProjectsBlogs 로 active 업데이트
      else {
        const status = await updateProjectsBlogs(projectSlug, blogId, {
          active: newActive,
        });
        if (status) {
          setProjectBlogsState((prev) =>
            prev.map((pb) =>
              pb.blog_id === blogId ? { ...pb, active: newActive } : pb
            )
          );
        }
      }
    } catch (error) {
      console.error("Error toggling blog active:", error);
      // 3) 에러 시 이전 상태로 롤백
      setBlogCardData((prev) =>
        prev.map((blog) =>
          blog.id === blogId ? { ...blog, active: !newActive } : blog
        )
      );
    } finally {
      // 로딩 해제
      setLoading(blogId, false);
    }
  };

  return (
    <div className="space-y-3">
      {blogCardData.map((blog) => {
        const isLoading = loadingIds.has(blog.id);
        return (
          <div
            key={blog.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <p className="font-medium">{blog.name}</p>
              <p className="text-xs text-gray-500">{blog.blog_slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {blog.active ? "활성화" : "비활성화"}
              </span>
              <Switch
                checked={blog.active}
                onCheckedChange={(checked) =>
                  handleToggleActive(blog.id, checked)
                }
                disabled={isLoading}
              />
            </div>
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => router.push(`/blogs?mode=add`)}
      >
        블로그 추가하러 가기
      </Button>
    </div>
  );
}
