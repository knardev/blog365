"use client";

import { useState, useTransition, useOptimistic } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { deleteProjectsBlogs } from "@/features/tracker/actions/delete-projects-blogs";
import { updateProjectsBlogs } from "@/features/tracker/actions/update-projects-blogs";

export function ProjectsBlogsCards({
  blogs,
  projectSlug,
}: {
  blogs: ProjectsBlogsWithDetail[];
  projectSlug: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic state for blogs
  const [optimisticBlogs, setOptimisticBlogs] = useOptimistic(
    blogs,
    (state, { blogId, active }) =>
      state.map((blog) =>
        blog.blog_id === blogId ? { ...blog, active } : blog
      )
  );

  const handleDelete = async (blogId: string) => {
    setLoading(blogId);

    try {
      await deleteProjectsBlogs(projectSlug, blogId, `/${projectSlug}/tracker`);
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (blogId: string, newActive: boolean) => {
    setLoading(blogId);

    // Update optimistically
    startTransition(() => {
      setOptimisticBlogs({ blogId, active: newActive });
    });

    try {
      await updateProjectsBlogs(
        projectSlug,
        blogId,
        { active: newActive },
        `/${projectSlug}/tracker`
      );
    } catch (error) {
      console.error("Error updating blog active status:", error);
      // Revert state if the update fails
      startTransition(() => {
        setOptimisticBlogs({ blogId, active: !newActive });
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <ul className="space-y-3">
      {optimisticBlogs.map((blog) => (
        <li
          key={blog.id}
          className="flex justify-between items-center border-b last:border-b-0 py-2"
        >
          {/* Blog Info */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-800">
              {blog?.blogs?.name ?? "N/A"}
            </p>
            <p className="text-xs text-gray-500">
              {blog?.blogs?.blog_slug ?? "N/A"}
            </p>
          </div>

          {/* Action Buttons */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={blog.active}
                    onCheckedChange={(checked) =>
                      handleUpdate(blog.blog_id!, checked)
                    }
                    disabled={loading === blog.blog_id || isPending}
                  />
                  <span className="text-sm">
                    추적 {blog.active ? "활성화" : "비활성화"}
                  </span>
                </div>
                <hr className="my-2 border-gray-200" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDelete(blog.blog_id!)}
                  disabled={loading === blog.blog_id}
                >
                  {loading === blog.blog_id ? (
                    <span className="animate-spin w-4 h-4 mr-2">⏳</span>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  삭제
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </li>
      ))}
    </ul>
  );
}
