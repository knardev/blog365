"use client";

import React, { useTransition, useState, useEffect } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { deleteKeywordCategory } from "@/features/setting/actions/delete-keyword-categories";
import { updateKeywordCategory } from "@/features/setting/actions/update-keyword-categories";
import { useRecoilState } from "recoil";
import { projectCategoriesAtom } from "@/features/projects/atoms/state";
import { KeywordCategories } from "../queries/define-fetch-keyword-categories";

interface KeywordCategoriesCardsProps {
  initialCategories: KeywordCategories;
  projectSlug: string;
}

export function KeywordCategoriesCards({
  initialCategories,
  projectSlug,
}: KeywordCategoriesCardsProps) {
  // Recoil 아톰 구독
  const [categories, setCategories] = useRecoilState(projectCategoriesAtom);

  useEffect(() => {
    // 최초로 categories가 비어있을 때만 초기화
    if (categories.length === 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories, setCategories, categories.length]);

  // Keep track of loading state for certain actions
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  /**
   * setLoading
   * - Add or remove a category ID from the loading set
   */
  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingIds((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  /**
   * handleOptimisticUpdate
   * - Immediately change the name of a category in Recoil state
   */
  const handleOptimisticUpdate = (id: string, newName: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: newName } : cat))
    );
  };

  /**
   * rollbackUpdate
   * - If server update fails, revert the Recoil state to the original name
   */
  const rollbackUpdate = (id: string, originalName: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: originalName } : cat))
    );
  };

  /**
   * handleOptimisticDelete
   * - Immediately remove a category from Recoil state
   */
  const [lastDeletedCategory, setLastDeletedCategory] = useState<
    KeywordCategories[number] | null
  >(null);

  const handleOptimisticDelete = (deletedCat: KeywordCategories[number]) => {
    setLastDeletedCategory(deletedCat);
    setCategories((prev) => prev.filter((cat) => cat.id !== deletedCat.id));
  };

  /**
   * rollbackDelete
   * - If server delete fails, re-insert the last deleted category
   */
  const rollbackDelete = () => {
    if (!lastDeletedCategory) return;
    setCategories((prev) => [...prev, lastDeletedCategory]);
    setLastDeletedCategory(null);
  };

  /**
   * handleUpdateName
   * - Called when user finishes editing category name
   * - Perform an optimistic update, then call server
   */
  const handleUpdateName = (id: string, newName: string) => {
    const original = categories.find((cat) => cat.id === id);
    if (!original) return;

    // 1) Optimistic update
    handleOptimisticUpdate(id, newName);

    // 2) Start the server request in a transition
    setLoading(id, true);
    startTransition(async () => {
      try {
        await updateKeywordCategory(projectSlug, id, { name: newName });
      } catch (error) {
        console.error("Error updating keyword category:", error);
        // Roll back to original name
        rollbackUpdate(id, original.name ?? "");
      } finally {
        setLoading(id, false);
      }
    });
  };

  /**
   * handleDelete
   * - Called when user clicks "delete" in the popover
   * - Perform an optimistic delete, then call server
   */
  const handleDelete = (cat: KeywordCategories[number]) => {
    if (!confirm(`정말로 "${cat.name}" 카테고리를 삭제하시겠습니까?`)) return;

    // 1) Optimistic delete
    handleOptimisticDelete(cat);

    // 2) Start the server request in a transition
    setLoading(cat.id, true);
    startTransition(async () => {
      try {
        await deleteKeywordCategory(
          projectSlug,
          cat.id,
          `/${projectSlug}/setting`
        );
      } catch (error) {
        console.error("Error deleting keyword category:", error);
        // Roll back
        rollbackDelete();
      } finally {
        setLoading(cat.id, false);
      }
    });
  };

  return (
    <ul className="space-y-3 w-40">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex justify-between items-center border-b last:border-b-0 py-2"
        >
          <Input
            type="text"
            variant="underline"
            defaultValue={category.name ?? "N/A"}
            placeholder="카테고리 이름"
            onBlur={(e) => handleUpdateName(category.id, e.target.value)}
            disabled={loadingIds.has(category.id) || isPending}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isPending}>
                <EllipsisVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDelete(category)}
                  disabled={loadingIds.has(category.id) || isPending}
                >
                  {loadingIds.has(category.id) ? (
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
