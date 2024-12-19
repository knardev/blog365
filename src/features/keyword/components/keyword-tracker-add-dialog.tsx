"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { addKeywordTracker } from "@/features/keyword/actions/add-keyword-tracker";
import { KeywordCategories } from "@/features/keyword/queries/define-fetch-keyword-categories";

export function KeywordTrackerAddDialog({
  projectSlug,
  revalidateTargetPath,
  keywordCategories,
}: {
  projectSlug: string;
  revalidateTargetPath: string;
  keywordCategories: KeywordCategories[];
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
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
        revalidateTargetPath,
      });
    } catch (error) {
      console.error("Error adding keyword tracker:", error);
    } finally {
      setIsSaving(false);
      setKeyword("");
      setSelectedCategory(null);
      setOpenDialog(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpenDialog(isOpen);
        if (!isOpen) {
          setKeyword("");
          setSelectedCategory(null);
          setOpenPopover(false);
        }
      }}
      open={openDialog}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + 키워드 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>추적 키워드 추가</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-600">
            추적할 키워드와 카테고리를 선택하세요.
          </p>
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
          <Button
            variant="default"
            className="self-end"
            onClick={handleSave}
            disabled={!keyword || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
