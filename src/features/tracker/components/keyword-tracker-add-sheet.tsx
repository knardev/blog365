"use client";
import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { cn } from "@/utils/shadcn/utils";
import { addKeywordTracker } from "@/features/tracker/actions/add-keyword-tracker";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export function KeywordTrackerAddSheet({
  projectSlug,
  keywordCategories,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories[];
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);

  const selectedCategoryLabel = keywordCategories.find(
    (category) => category.id === selectedCategory
  )?.name;

  const handleSave = async () => {
    if (!keyword) return;

    setIsSaving(true);
    try {
      await addKeywordTracker({
        projectSlug,
        keywordName: keyword,
        categoryId: selectedCategory || undefined,
        revalidateTargetPath: `/${projectSlug}/tracker`,
      });
    } catch (error) {
      console.error("Error adding keyword tracker:", error);
    } finally {
      setIsSaving(false);
      setKeyword("");
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
            추적할 키워드와 카테고리를 선택하세요.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="keyword">키워드</Label>
            <Input
              id="keyword"
              placeholder="예: 미금역 치과"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Popover open={openPopover} onOpenChange={setOpenPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPopover}
                  className="w-full justify-between"
                >
                  {selectedCategoryLabel || "카테고리를 선택하세요"}
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
                          value={category.id}
                          onSelect={() => {
                            setSelectedCategory(category.id);
                            setOpenPopover(false);
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
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button
            variant="default"
            className="self-end"
            onClick={handleSave}
            disabled={!keyword || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
