import React from "react";
// actions
import { fetchBlog } from "@/features/blogs/actions/fetch-blogs";
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
// components
import { ProjectsBlogsSheet } from "@/features/tracker/components/projects-blogs-sheet";
import { KeywordTrackerAddSheet } from "@/features/tracker/components/keyword-tracker-add-sheet";
import { StrictModeSwitch } from "@/features/tracker/components/strict-mode-switch";
import { ClipboardShareButton } from "@/features/tracker/components/clipboard-share-button"; // 새로 만든 컴포넌트 import
import { KeywordTrackerStatisticsBoard } from "@/features/tracker/components/keyword-tracker-statistics-borad";

export async function KeywordTrackerHeader({
  profileId,
  projectSlug,
  readonly = false,
}: {
  profileId: string;
  projectSlug: string;
  readonly?: boolean;
}) {
  // Fetch supplementary data
  const [projectBlogs, availableBlogs, keywordCategories] = await Promise.all([
    fetchProjectsBlogs(projectSlug),
    fetchBlog(profileId),
    fetchKeywordCategories(projectSlug),
  ]);

  if (!projectBlogs) {
    return null;
  }

  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${projectSlug}`;

  return (
    <div className="w-full space-y-4">
      {/* Buttons in a responsive row */}
      <div className="flex justify-between items-center">
        <StrictModeSwitch />
        <div className="flex gap-2">
          {/* 클립보드 공유 버튼 컴포넌트 사용 */}
          <ClipboardShareButton shareLink={shareLink} />
          <ProjectsBlogsSheet
            blogs={projectBlogs}
            availableBlogs={availableBlogs}
            projectSlug={projectSlug}
          />
          <KeywordTrackerAddSheet
            projectSlug={projectSlug}
            keywordCategories={keywordCategories ?? []}
          />
        </div>
      </div>
      {/* Cards in a responsive grid */}
      <KeywordTrackerStatisticsBoard
        projectSlug={projectSlug}
        readonly={readonly}
      />
    </div>
  );
}
