"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKeywordCategory } from "@/features/setting/actions/add-keyword-categories";
import { revalidatePath } from "next/cache";

export function AddKeywordCategoryInput({
  projectSlug,
}: {
  projectSlug: string;
}) {
  const [categoryName, setCategoryName] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    setIsLoading(true);
    try {
      const newCategory = await addKeywordCategory(
        projectSlug,
        categoryName,
        `/${projectSlug}/setting`
      );

      if (newCategory) {
        setCategoryName("");
      }
    } catch (error) {
      console.error("Error adding keyword category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Input
        type="text"
        placeholder="카테고리 이름 입력"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        disabled={isLoading || isPending}
      />
      <Button
        onClick={handleAddCategory}
        disabled={isLoading || isPending}
        className="whitespace-nowrap"
      >
        {isLoading ? "추가 중..." : "추가"}
      </Button>
    </div>
  );
}
