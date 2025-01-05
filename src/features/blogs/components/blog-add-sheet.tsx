"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBlog } from "@/features/blogs/actions/add-blog";
import { QuestionMarkTooltip } from "@/components/custom-ui/question-tooltip";

/**
 * URL 혹은 슬러그를 입력받아 실제 블로그 슬러그만 추출하는 함수
 * @param input - 사용자가 입력한 문자열
 * @returns - 마지막 path (slug) 또는 그대로 input
 */
function extractBlogSlug(input: string): string {
  if (!input.trim()) return "";

  try {
    const url = new URL(input);
    const path = url.pathname; // 예: "/ehdehdrn" 또는 "/dentallibrary/some/extra"
    // 맨 앞/뒤 슬래시 제거 후 분할
    const segments = path.split("/").filter(Boolean);
    // segments[0]이 첫 번째 파라미터
    // segments = ["dentallibrary", "some", "extra"]라면 segments[0] = "dentallibrary"
    return segments[0] ?? input;
  } catch (e) {
    // URL 파싱이 안 되면(단순 문자열이면) 그대로 반환
    return input;
  }
}

export function BlogAddSheet({
  profileId,
  revalidateTargetPath,
}: {
  profileId: string;
  revalidateTargetPath: string;
}) {
  const [blogName, setBlogName] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 인플루언서 계정 체크박스 상태
  const [isInfluencer, setIsInfluencer] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 쿼리 파라미터로 Sheet 열림 여부 제어
  const mode = searchParams.get("mode");
  const isOpen = mode === "add";

  const handleCloseSheet = () => {
    router.replace("/blogs");
  };

  const handleSave = async () => {
    if (!blogName.trim() || !blogSlug.trim()) return;

    setIsSaving(true);
    try {
      // blogSlug에서 "https://..." 형태면 마지막 경로만 추출
      const finalSlug = extractBlogSlug(blogSlug);

      await addBlog({
        profileId,
        blogName,
        blogSlug: finalSlug,
        isInfluencer,
        revalidateTargetPath,
      });

      // 성공적으로 저장 후 시트 닫기
      handleCloseSheet();
    } catch (error) {
      console.error("Error adding blog:", error);
    } finally {
      setIsSaving(false);
      setBlogName("");
      setBlogSlug("");
      setIsInfluencer(false);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsInfluencer(checked);
  };

  // 체크박스 여부에 따라 문구 동적 생성
  const titleText = isInfluencer ? "새 인플루언서 추가" : "새 블로그 추가";
  const descriptionText = isInfluencer
    ? "새 인플루언서 별칭과 인플루언서 주소(ID)를 입력하세요."
    : "새 블로그 별칭과 블로그 주소(ID)를 입력하세요.";

  const nameLabel = isInfluencer ? "인플루언서 별칭" : "블로그 별칭";
  const slugLabel = isInfluencer ? "인플루언서 주소/ID" : "블로그 주소/ID";
  const slugPlaceholder = isInfluencer
    ? "인플루언서 주소/아이디를 입력하세요."
    : "블로그 주소/아이디를 입력하세요.";

  const tooltipContent = isInfluencer
    ? "인플루언서 주소를 주소창에서 복사해주시면 됩니다."
    : "블로그 주소를 주소창에서 복사해주시면 됩니다.";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCloseSheet();
        }
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{titleText}</SheetTitle>
          <SheetDescription>{descriptionText}</SheetDescription>
        </SheetHeader>
        <div className="my-3 space-y-4">
          {/* 인플루언서 계정 체크박스 */}
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="influencerCheckbox"
              checked={isInfluencer}
              onCheckedChange={handleCheckboxChange}
              disabled={isSaving}
            />
            <Label
              htmlFor="influencerCheckbox"
              className="text-sm cursor-pointer"
            >
              인플루언서 계정이라면
            </Label>
          </div>

          {/* 별칭 입력 */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="blogName">{nameLabel}</Label>
            <Input
              id="blogName"
              placeholder="예: 내 계정"
              value={blogName}
              onChange={(e) => setBlogName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 주소/ID 입력 + 물음표 아이콘 */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="blogSlug">{slugLabel}</Label>
              <QuestionMarkTooltip content={tooltipContent} />
            </div>
            <Input
              id="blogSlug"
              placeholder={slugPlaceholder}
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
              onClick={handleCloseSheet}
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
