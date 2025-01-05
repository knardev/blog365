"use client";

import React, { useState, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { Blog } from "@/features/blogs/types/types";
import { addProjectsBlogs } from "@/features/tracker/actions/add-projects-blogs";
import { updateProjectsBlogs } from "@/features/tracker/actions/update-projects-blogs";

interface ProjectsBlogsCardsProps {
  /**
   * 이미 등록된 블로그 정보 (ProjectsBlogsWithDetail[]).
   * blog_id(= Blog.id), active 여부 등을 포함
   */
  projectBlogs: ProjectsBlogsWithDetail[];

  /** 전체 블로그 목록 */
  availableBlogs: Blog[];

  /** 현재 프로젝트 Slug */
  projectSlug: string;
}

/**
 * 전체 블로그(availableBlogs) + 프로젝트 등록/활성화 상태(projectBlogs)를 합쳐
 * 초기 optimistic 리스트를 생성하는 헬퍼 함수
 */
function createInitialOptimisticBlogs(
  availableBlogs: Blog[],
  projectBlogs: ProjectsBlogsWithDetail[]
) {
  return availableBlogs.map((ab) => {
    // 프로젝트에 등록되어 있다면 active 여부 확인
    const pb = projectBlogs.find((p) => p.blog_id === ab.id);
    return {
      id: ab.id, // Blog.id
      name: ab.name, // Blog.name
      blog_slug: ab.blog_slug, // Blog.blog_slug
      active: pb?.active ?? false,
    };
  });
}

export function ProjectsBlogsCards({
  projectBlogs,
  availableBlogs,
  projectSlug,
}: ProjectsBlogsCardsProps) {
  // ---------- Optimistic State ----------
  // 1) 초기 state: 모든 Blog 정보를 {id, name, blog_slug, active}로 구성
  // 2) updater 함수: blogId, newActive를 받아 해당 blog의 active를 바꿔줌
  const [optimisticBlogs, setOptimisticBlogs] = useOptimistic(
    createInitialOptimisticBlogs(availableBlogs, projectBlogs),
    (currentState, { blogId, newActive }) => {
      return currentState.map((blog) =>
        blog.id === blogId ? { ...blog, active: newActive } : blog
      );
    }
  );

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
    setOptimisticBlogs({ blogId, newActive });

    // 2) 지금 토글 중인 blogId를 로딩 상태로 표시 (해당 스위치만 disabled)
    setLoading(blogId, true);

    try {
      // 이미 프로젝트에 등록된 블로그인지 확인
      const existingProjectBlog = projectBlogs.find(
        (pb) => pb.blog_id === blogId
      );

      // 등록된 적 없는 블로그인데 스위치를 ON → addProjectsBlogs
      if (!existingProjectBlog) {
        if (newActive) {
          await addProjectsBlogs(
            projectSlug,
            blogId,
            `/${projectSlug}/tracker`
          );
        }
      }
      // 이미 등록된 블로그 → updateProjectsBlogs 로 active 업데이트
      else {
        await updateProjectsBlogs(
          projectSlug,
          blogId,
          { active: newActive },
          `/${projectSlug}/tracker`
        );
      }
    } catch (error) {
      console.error("Error toggling blog active:", error);
      // 3) 에러 시 이전 상태로 롤백
      setOptimisticBlogs({ blogId, newActive: !newActive });
    } finally {
      // 로딩 해제
      setLoading(blogId, false);
    }
  };

  return (
    <div className="space-y-3">
      {optimisticBlogs.map((blog) => {
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
