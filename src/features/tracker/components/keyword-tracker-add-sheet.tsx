"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
} from "@/components/ui/select";
import { addKeywordTracker } from "@/features/tracker/actions/add-keyword-tracker";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export function KeywordTrackerAddSheet({
  projectSlug,
  keywordCategories,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories[];
}) {
  const [keywords, setKeywords] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // ?mode=keyword 인지 확인해서 Sheet 열고 닫음
  const mode = searchParams.get("mode");
  const isOpen = mode === "keyword";

  // Sheet 열기: URL에 ?mode=keyword 붙이기
  const handleOpenSheet = () => {
    router.push(`/${projectSlug}/tracker?mode=keyword`);
  };

  // Sheet 닫기: ?mode=keyword 제거
  const handleCloseSheet = () => {
    router.replace(`/${projectSlug}/tracker`);
  };

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
      // 저장 후 Sheet 닫기
      handleCloseSheet();
    } catch (error) {
      console.error("Error adding keyword tracker:", error);
    } finally {
      setIsSaving(false);
      setKeywords("");
      setSelectedCategory(null);
    }
  };

  return (
    <>
      {/* SheetTrigger 대신, 버튼을 누르면 router.push로 ?mode=keyword 설정 */}
      <Button variant="outline" size="sm" onClick={handleOpenSheet}>
        + 키워드 추가
      </Button>

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          // Sheet가 닫힐 때 ?mode=keyword 제거
          if (!open) {
            handleCloseSheet();
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>추적 키워드 추가</SheetTitle>
            <SheetDescription>
              카테고리를 먼저 선택하시고, <br />
              키워드를 엔터로 구분하여 입력하세요.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* 카테고리 선택 */}
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
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {keywordCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/${projectSlug}/setting`)}
                  >
                    카테고리 추가하러 가기
                  </Button>
                </SelectContent>
              </Select>
            </div>

            {/* 키워드 입력 */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="keywords">키워드들</Label>
              <Textarea
                id="keywords"
                placeholder="예: 미금역치과, 강남역치과, 서초치과"
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
    </>
  );
}
