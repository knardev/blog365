"use client";

import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { ChevronsUpDown } from "lucide-react";
import { updateKeywordTracker } from "@/features/tracker/actions/update-keyword-tracker";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

interface CategorySelectorProps {
  trackerId: string;
  currentCategoryId: string | null;
  currentCategoryName: string | null;
  keywordCategories: KeywordCategories[];
  projectSlug: string;
}

export function CategorySelector({
  trackerId,
  currentCategoryId,
  currentCategoryName, // 필요하다면 사용
  keywordCategories,
  projectSlug,
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategoryId);
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId); // Optimistic update
    setIsSaving(true);

    try {
      await updateKeywordTracker(
        trackerId,
        { category_id: categoryId },
        `/${projectSlug}/tracker`
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      setSelectedCategory(currentCategoryId); // 롤백
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Select
      // Select가 제어 컴포넌트로 동작하도록 value와 onValueChange 설정
      value={selectedCategory ?? ""}
      onValueChange={(value) => handleCategoryChange(value)}
      disabled={isSaving}
    >
      <SelectTrigger
        className="max-w-1/2 justify-between h-7"
        aria-label="카테고리 선택"
      >
        <SelectValue placeholder="카테고리 선택" />
        {/* <ChevronsUpDown className="opacity-50" /> */}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {/* <SelectLabel>카테고리</SelectLabel> */}
          {keywordCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
