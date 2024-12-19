"use client";

import React, { useState } from "react";
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
import { addBlog } from "@/features/blogs/actions/add-blog";

export function BlogAddDialog({
  profileId,
  revalidateTargetPath,
}: {
  profileId: string;
  revalidateTargetPath: string;
}) {
  const [blogName, setBlogName] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

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
    } catch (error) {
      console.error("Error adding blog:", error);
    } finally {
      setIsSaving(false);
      setBlogName("");
      setBlogSlug("");
      setOpenDialog(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpenDialog(isOpen);
        if (!isOpen) {
          setBlogName("");
          setBlogSlug("");
        }
      }}
      open={openDialog}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + 블로그 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 블로그 추가</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-600">
            새 블로그 별칭과 블로그 ID를 입력하세요.
          </p>
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
          <Button
            variant="default"
            className="self-end"
            onClick={handleSave}
            disabled={!blogName || !blogSlug || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
