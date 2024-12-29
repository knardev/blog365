"use client";

import { useState, useTransition, useOptimistic } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { deleteProjectsBlogs } from "@/features/tracker/actions/delete-projects-blogs";
import { updateProjectsBlogs } from "@/features/tracker/actions/update-projects-blogs";
import { updateBlog } from "@/features/blogs/actions/update-blog";

export function ProjectsBlogsCards({
  blogs,
  projectSlug,
}: {
  blogs: ProjectsBlogsWithDetail[];
  projectSlug: string;
}) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [optimisticBlogs, setOptimisticBlogs] = useOptimistic(
    blogs,
    (
      state,
      {
        blogId,
        name,
        active,
      }: { blogId: string; name?: string; active?: boolean }
    ) =>
      state.map((blog) => {
        if (blog.blog_id === blogId) {
          if (!blog.blogs) {
            console.warn(
              `Blog with blog_id ${blogId} has a null 'blogs' field.`
            );
            return blog;
          }

          return {
            ...blog,
            ...(name
              ? {
                  blogs: {
                    ...blog.blogs,
                    name,
                  },
                }
              : {}),
            ...(active !== undefined ? { active } : {}),
          };
        }
        return blog;
      })
  );

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

  const handleDelete = async (blogId: string) => {
    setLoading(blogId, true);
    try {
      await deleteProjectsBlogs(projectSlug, blogId, `/${projectSlug}/tracker`);
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setLoading(blogId, false);
    }
  };

  const handleUpdateName = async (blogId: string, newName: string) => {
    setLoading(blogId, true);
    startTransition(() => {
      setOptimisticBlogs({ blogId, name: newName });
    });

    try {
      await updateBlog(blogId, { name: newName }, `/${projectSlug}/tracker`);
    } catch (error) {
      console.error("Error updating blog name:", error);
      startTransition(() => {
        const originalBlog = blogs.find((b) => b.blog_id === blogId);
        if (originalBlog) {
          setOptimisticBlogs({
            blogId,
            name: originalBlog.blogs?.name ?? "N/A",
          });
        }
      });
    } finally {
      setLoading(blogId, false);
    }
  };

  const handleUpdateActive = async (blogId: string, newActive: boolean) => {
    setLoading(blogId, true);
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
      startTransition(() => {
        setOptimisticBlogs({ blogId, active: !newActive });
      });
    } finally {
      setLoading(blogId, false);
    }
  };

  return (
    <ul className="space-y-3">
      {optimisticBlogs.map((blog) => (
        <li
          key={blog.id}
          className="flex justify-between items-center border-b last:border-b-0 py-2"
        >
          <div className="flex flex-col gap-1">
            <Input
              type="text"
              variant="underline"
              defaultValue={blog?.blogs?.name ?? "N/A"}
              placeholder="블로그 별칭"
              onBlur={(e) => handleUpdateName(blog.blog_id, e.target.value)}
            />
            <p className="text-xs text-gray-500 px-1">
              {blog?.blogs?.blog_slug ?? "N/A"}
            </p>
          </div>

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
                    disabled={loadingIds.has(blog.blog_id)}
                    onCheckedChange={(checked) =>
                      handleUpdateActive(blog.blog_id, checked)
                    }
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
                  onClick={() => handleDelete(blog.blog_id)}
                  disabled={loadingIds.has(blog.blog_id)}
                >
                  {loadingIds.has(blog.blog_id) ? (
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
