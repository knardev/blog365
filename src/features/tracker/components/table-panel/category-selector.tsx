"use client";

// hooks
import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
// atoms
import {
  trackerTableDataAtom,
  trackerStatisticsAtom,
} from "@/features/tracker/atoms/states";
// components
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
// actions
import { updateKeywordTracker } from "@/features/tracker/actions/update-keyword-tracker";
// types
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
  currentCategoryName, // 필요하다면 사용
  keywordCategories,
  projectSlug,
}: CategorySelectorProps) {
  // console.log("currentCategoryName", currentCategoryName);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(currentCategoryId);
  const setTrackerTableData = useSetRecoilState(trackerTableDataAtom);
  const setTrackerStatistics = useSetRecoilState(trackerStatisticsAtom);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId); // Optimistic update
    setIsSaving(true);

    try {
      const data = await updateKeywordTracker(trackerId, {
        category_id: categoryId,
      });
      const keyword_categories = keywordCategories.filter(
        (category) => category.id === categoryId
      );
      setTrackerTableData((prev) =>
        prev.map((tracker) =>
          tracker.id === trackerId
            ? {
                ...tracker,
                category_id: categoryId,
                keyword_categories: keyword_categories[0],
              }
            : tracker
        )
      );
      setTrackerStatistics((prev) =>
        prev.map((tracker) =>
          tracker.id === trackerId
            ? {
                ...tracker,
                category_id: categoryId,
                keyword_categories: keyword_categories[0],
              }
            : tracker
        )
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
