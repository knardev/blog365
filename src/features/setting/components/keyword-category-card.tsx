"use client";

import { useState, useTransition, useOptimistic } from "react";
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

export function KeywordCategoriesCards({
  keywordCategories,
  projectSlug,
}: {
  keywordCategories: {
    id: string;
    name: string | null;
    created_at: string;
    project_id: string | null;
  }[];
  projectSlug: string;
}) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [optimisticKeywordCategories, setOptimisticKeywordCategories] =
    useOptimistic(
      keywordCategories,
      (state, { id, name }: { id: string; name?: string }) =>
        state.map((category) =>
          category.id === id
            ? { ...category, ...(name ? { name } : {}) }
            : category
        )
    );

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

  const handleDelete = async (id: string) => {
    setLoading(id, true);
    try {
      await deleteKeywordCategory(projectSlug, id, `/${projectSlug}/setting`);
      // startTransition(() => {
      //   setOptimisticKeywordCategories((state) =>
      //     state.filter((category) => category.id !== id)
      //   );
      // });
    } catch (error) {
      console.error("Error deleting keyword category:", error);
    } finally {
      setLoading(id, false);
    }
  };

  const handleUpdateName = async (id: string, newName: string) => {
    setLoading(id, true);
    startTransition(() => {
      setOptimisticKeywordCategories({ id, name: newName });
    });

    try {
      await updateKeywordCategory(projectSlug, id, { name: newName });
    } catch (error) {
      console.error("Error updating keyword category:", error);
      const originalCategory = keywordCategories.find((c) => c.id === id);
      if (originalCategory) {
        startTransition(() => {
          setOptimisticKeywordCategories({
            id,
            name: originalCategory.name ?? "",
          });
        });
      }
    } finally {
      setLoading(id, false);
    }
  };

  return (
    <ul className="space-y-3 w-40">
      {optimisticKeywordCategories.map((category) => (
        <li
          key={category.id}
          className="flex justify-between items-center border-b last:border-b-0 py-2"
        >
          <div className="flex flex-col gap-1">
            <Input
              type="text"
              variant="underline"
              defaultValue={category.name ?? "N/A"}
              placeholder="카테고리 이름"
              onBlur={(e) => handleUpdateName(category.id, e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDelete(category.id)}
                  disabled={loadingIds.has(category.id)}
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
