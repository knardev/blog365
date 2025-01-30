"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/utils/shadcn/utils";
import { updateKeywordTracker } from "@/features/keyword/actions/update-keyword-tracker";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

interface CategorySelectorProps {
  trackerId: string;
  currentCategoryId: string | null;
  currentCategoryName: string | null;
  keywordCategories: KeywordCategories;
  projectSlug: string;
}

export function CategorySelector({
  trackerId,
  currentCategoryId,
  currentCategoryName,
  keywordCategories,
  projectSlug,
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategoryId);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId); // Optimistic update
    setIsSaving(true);

    try {
      await updateKeywordTracker(trackerId, { category_id: categoryId });
    } catch (error) {
      console.error("Failed to update category:", error);
      setSelectedCategory(currentCategoryId); // Rollback on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="max-w-1/2 justify-between"
        >
          {currentCategoryName || "카테고리 선택"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command>
          <CommandInput placeholder="카테고리 검색..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {keywordCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => {
                    handleCategoryChange(category.id);
                    setOpen(false);
                  }}
                  className={cn(
                    selectedCategory === category.id && "bg-gray-100"
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{category.name}</span>
                    {selectedCategory === category.id && (
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
  );
}
