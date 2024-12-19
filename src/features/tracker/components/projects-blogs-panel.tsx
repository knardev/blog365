import React from "react";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { Blog } from "@/features/blogs/types/types";
import { ProjectBlogAddingDialog } from "./projects-blogs-add-dialog";
import { ProjectsBlogsCards } from "./projects-blogs-cards";

export function ProjectsBlogsPanel({
  blogs,
  availableBlogs,
  projectSlug,
}: {
  blogs: ProjectsBlogsWithDetail[];
  availableBlogs: Blog[];
  projectSlug: string;
}) {
  return (
    <div className="rounded-md h-full py-0 px-2 overflow-y-auto">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-lg font-semibold">타겟 블로그</h2>
        <ProjectBlogAddingDialog
          availableBlogs={availableBlogs}
          projectBlogs={blogs}
          projectSlug={projectSlug}
        />
      </div>
      <ProjectsBlogsCards blogs={blogs} projectSlug={projectSlug} />
    </div>
  );
}
