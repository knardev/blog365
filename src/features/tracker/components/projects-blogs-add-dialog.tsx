"use client";

import React, { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/utils/shadcn/utils";
import { Blog } from "@/features/blogs/types/types";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { addProjectsBlogs } from "@/features/tracker/actions/add-projects-blogs";

export function ProjectBlogAddingDialog({
  availableBlogs,
  projectBlogs,
  projectSlug,
}: {
  availableBlogs: Blog[];
  projectBlogs: ProjectsBlogsWithDetail[];
  projectSlug: string;
}) {
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlogLabel = availableBlogs.find(
    (blog) => blog.id === selectedBlog
  )?.name;

  const selectedBlogSlug = availableBlogs.find(
    (blog) => blog.id === selectedBlog
  )?.blog_slug;

  // Get blog IDs already associated with the project
  const existingBlogIds = new Set(projectBlogs.map((pb) => pb.blog_id));

  const handleSave = async () => {
    if (!selectedBlog) return;

    setIsSaving(true);
    try {
      await addProjectsBlogs(
        projectSlug,
        selectedBlog,
        `/${projectSlug}/tracker`
      );
    } catch (error) {
      console.error("Error adding blog to project:", error);
    } finally {
      setIsSaving(false);
      setSelectedBlog(null);
      setOpenDialog(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpenDialog(isOpen);
        if (!isOpen) {
          setSelectedBlog(null); // Reset selected blog
          setOpenPopover(false); // Close popover
        }
      }}
      open={openDialog}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>타겟 블로그 설정</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-600">
            상위노출을 추적할 블로그를 선택하세요.
          </p>

          {/* Combobox Implementation */}
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openPopover}
                className="w-full justify-between"
              >
                {selectedBlogLabel
                  ? `${selectedBlogLabel} (${selectedBlogSlug})`
                  : "블로그를 선택하세요"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full">
              <Command>
                <CommandInput placeholder="블로그 검색..." />
                <CommandList>
                  <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                  <CommandGroup>
                    {availableBlogs.map((blog) => (
                      <CommandItem
                        key={blog.id}
                        value={blog.id}
                        disabled={existingBlogIds.has(blog.id)} // Disable if blog is already in projectBlogs
                        onSelect={() => {
                          setSelectedBlog(blog.id);
                          setOpenPopover(false);
                        }}
                        className={cn(
                          existingBlogIds.has(blog.id) &&
                            "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>
                            {blog.name}{" "}
                            <span className="text-xs text-gray-500">
                              {blog.blog_slug}
                            </span>
                          </span>
                          {selectedBlog === blog.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Save Button */}
          <Button
            variant="default"
            className="self-end"
            onClick={handleSave}
            disabled={!selectedBlog || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
