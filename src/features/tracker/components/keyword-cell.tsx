"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import { softDeleteTracker } from "@/features/tracker/actions/soft-delete-keyword-tracker";

interface KeywordCellProps {
  keywords: {
    created_at: string;
    id: string;
    name: string;
  } | null;
  readonly: boolean;
  trackerId: string;
}

export function KeywordCell({
  keywords,
  readonly,
  trackerId,
}: KeywordCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const searchUrl = keywords
    ? `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${keywords.name}`
    : "#";

  const handleSoftDelete = async () => {
    try {
      await softDeleteTracker(trackerId); // Soft Delete Action 호출
      alert("Tracker deleted successfully.");
      setDialogOpen(false); // 다이얼로그 닫기
    } catch (error) {
      console.error("Error deleting tracker:", error);
      alert("Failed to delete tracker.");
    }
  };

  return (
    <div className="flex items-center justify-between">
      <a
        href={searchUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-500 underline"
      >
        {keywords?.name ?? "N/A"}
      </a>
      {!readonly && (
        <MoreHorizontal
          className="cursor-pointer ml-2 w-4"
          onClick={() => setDialogOpen(true)}
        />
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
          </DialogHeader>
          <p>이 트래커를 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="default" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleSoftDelete}>
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
