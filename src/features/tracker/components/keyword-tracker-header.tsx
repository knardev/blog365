import React from "react";
// components
import { ProjectsBlogsSheet } from "@/features/tracker/components/projects-blogs-sheet";
import { KeywordTrackerAddSheet } from "@/features/tracker/components/keyword-tracker-add-sheet";
import { StrictModeSwitch } from "@/features/tracker/components/strict-mode-switch";
import { ClipboardShareButton } from "@/features/tracker/components/clipboard-share-button";
import { KeywordTrackerStatisticsBoard } from "@/features/tracker/components/keyword-tracker-statistics-borad";
// types
import { Blogs } from "@/features/blogs/queries/define-fetch-blogs";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

interface KeywordTrackerHeaderProps {
  projectSlug: string;
  projectBlogs: ProjectsBlogsWithDetail[];
  availableBlogs: Blogs;
  keywordCategories: KeywordCategories;
  potentialExposureByDate: Record<string, number> | undefined;
  catchCountByDate: Record<string, number> | undefined;
  totalKeywords: number;
  todayCatchCount: number;
}

export function KeywordTrackerHeader({
  projectSlug,
  potentialExposureByDate,
  catchCountByDate,
  totalKeywords,
  todayCatchCount,
  projectBlogs,
  availableBlogs,
  keywordCategories,
}: KeywordTrackerHeaderProps) {
  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${projectSlug}`;

  return (
    <div className="w-full space-y-4">
      {/* Buttons in a responsive row */}
      <div className="flex justify-between items-center">
        <StrictModeSwitch />
        <div className="flex gap-2">
          <ClipboardShareButton shareLink={shareLink} />
          <ProjectsBlogsSheet
            blogs={projectBlogs}
            availableBlogs={availableBlogs}
            projectSlug={projectSlug}
          />
          <KeywordTrackerAddSheet
            projectSlug={projectSlug}
            keywordCategories={keywordCategories}
          />
        </div>
      </div>
      {/* Statistics Board */}
      <KeywordTrackerStatisticsBoard
        projectSlug={projectSlug}
        potentialExposureByDate={potentialExposureByDate}
        catchCountByDate={catchCountByDate}
        totalKeywords={totalKeywords}
        todayCatchCount={todayCatchCount}
      />
    </div>
  );
}
