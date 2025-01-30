"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { addKeywordTracker } from "@/features/tracker/actions/add-keyword-tracker";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export function KeywordTrackerAddSheet({
  projectSlug,
  keywordCategories,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories;
}) {
  const [keywords, setKeywords] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter(); // useRouter 훅 사용

  const handleSave = async () => {
    if (!keywords.trim()) return;
    setIsSaving(true);
    try {
      await addKeywordTracker({
        projectSlug,
        keywords,
        categoryId: selectedCategory || undefined,
        revalidateTargetPath: `/${projectSlug}/tracker`,
      });
    } catch (error) {
      console.error("Error adding keyword tracker:", error);
    } finally {
      setIsSaving(false);
      setKeywords("");
      setSelectedCategory(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          + 키워드 추가
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>추적 키워드 추가</SheetTitle>
          <SheetDescription>
            카테고리를 먼저 선택하시고, <br />
            추가하고 싶은 키워드를 엔터로 나눠 입력합니다.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select
              value={selectedCategory ?? ""}
              onValueChange={(value) => setSelectedCategory(value)}
              disabled={isSaving}
            >
              <SelectTrigger
                role="combobox"
                aria-expanded="false"
                className="w-full justify-between"
              >
                <SelectValue placeholder="카테고리를 선택하세요" />
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
                {/* 하단에 버튼 추가 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/${projectSlug}/setting`)}
                >
                  카테고리 추가하러 가기
                </Button>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="keywords">키워드들</Label>
            <Textarea
              id="keywords"
              placeholder="엔터로 구분해서 넣어주세요."
              value={keywords}
              rows={3}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button
            variant="default"
            className="self-end"
            onClick={handleSave}
            disabled={!keywords || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
