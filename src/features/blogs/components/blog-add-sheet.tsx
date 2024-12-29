"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBlog } from "@/features/blogs/actions/add-blog";

export function BlogAddSheet({
  profileId,
  revalidateTargetPath,
  openSheet,
  setOpenSheet,
}: {
  profileId: string;
  revalidateTargetPath: string;
  openSheet: boolean;
  setOpenSheet: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [blogName, setBlogName] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!blogName || !blogSlug) return;

    setIsSaving(true);
    try {
      await addBlog({
        profileId,
        blogName,
        blogSlug,
        revalidateTargetPath,
      });
      // 성공적으로 저장된 후 시트 닫기
      setOpenSheet(false);
    } catch (error) {
      console.error("Error adding blog:", error);
    } finally {
      setIsSaving(false);
      setBlogName("");
      setBlogSlug("");
    }
  };

  return (
    <Sheet open={openSheet} onOpenChange={setOpenSheet}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          + 블로그 추가
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>새 블로그 추가</SheetTitle>
          <SheetDescription>
            새 블로그 별칭과 블로그 ID를 입력하세요.
          </SheetDescription>
        </SheetHeader>
        <div className="my-3 space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="blogName">블로그 별칭</Label>
            <Input
              id="blogName"
              placeholder="예: 내 블로그"
              value={blogName}
              onChange={(e) => setBlogName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="blogSlug">블로그 ID</Label>
            <Input
              id="blogSlug"
              placeholder="예: my-blog"
              value={blogSlug}
              onChange={(e) => setBlogSlug(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <SheetFooter>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpenSheet(false)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!blogName || !blogSlug || isSaving}
            >
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
