"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/utils/shadcn/utils";
import { Blog } from "@/features/blogs/types/types";
import { addProjectsBlogs } from "@/features/tracker/actions/add-projects-blogs";

interface ProjectBlogSelectionComboboxProps {
  availableBlogs: Blog[];
  existingBlogIds: Set<string>;
  projectSlug: string;
}

export function ProjectBlogSelectionCombobox({
  availableBlogs,
  existingBlogIds,
  projectSlug,
}: ProjectBlogSelectionComboboxProps) {
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlogLabel = availableBlogs.find(
    (blog) => blog.id === selectedBlog
  )?.name;

  const selectedBlogSlug = availableBlogs.find(
    (blog) => blog.id === selectedBlog
  )?.blog_slug;

  const handleAddBlog = async (blogId: string) => {
    await addProjectsBlogs(projectSlug, blogId, `/${projectSlug}/tracker`);
  };

  const handleAdd = async () => {
    if (!selectedBlog) return;

    setIsSaving(true);
    try {
      await handleAddBlog(selectedBlog);
    } catch (error) {
      console.error("Error adding blog:", error);
    } finally {
      setIsSaving(false);
      setSelectedBlog(null);
      setOpenPopover(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openPopover}
            className="w-full justify-between"
            disabled={isSaving}
          >
            {selectedBlogLabel
              ? `${selectedBlogLabel} (${selectedBlogSlug})`
              : "추가할 블로그를 선택하세요"}
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
                    disabled={existingBlogIds.has(blog.id)}
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

      <Button
        variant="default"
        onClick={handleAdd}
        disabled={!selectedBlog || isSaving}
      >
        {isSaving ? "저장 중..." : "추가"}
      </Button>
    </div>
  );
}
