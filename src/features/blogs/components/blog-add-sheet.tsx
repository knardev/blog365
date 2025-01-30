"use client";

// hooks
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSetRecoilState } from "recoil";
// atoms
import { blogsWithAnalyticsAtom } from "@/features/blogs/atoms/states";
// components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { QuestionMarkTooltip } from "@/components/custom-ui/question-tooltip";
// actions
import { addBlog } from "@/features/blogs/actions/add-blog";
import { scrapBlogAnalytics } from "@/features/blogs/actions/scrap-blog-analytics";
import { fetchSingleBlogsWithAnalytics } from "@/features/blogs/actions/fetch-single-blog-with-analytics";
// types
import { AddBlog } from "@/features/blogs/queries/define-add-blog";

export function BlogAddSheet({ profileId }: { profileId: string }) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const [isOpen, setIsOpen] = useState(mode === "add");
  const [blogName, setBlogName] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [connectedBlogSlug, setConnectedBlogSlug] = useState("");
  const [newBlogs, setNewBlogs] = useState<AddBlog>([]);
  const setBlogsWithAnalytics = useSetRecoilState(blogsWithAnalyticsAtom);
  const [isScrapping, setIsScrapping] = useState(false);
  const [completedScrappedTrakers, setCompletedScrappedTrakers] = useState(0);
  const [failedScrappedBlogs, setFailedScrappedBlogs] = useState<string[]>([]);

  // 인플루언서 계정 체크박스 상태
  const [isInfluencer, setIsInfluencer] = useState(false);

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

  const handleSave = async () => {
    if (!blogName.trim() || !blogSlug.trim()) return;

    setIsSaving(true);
    try {
      // blogSlug에서 "https://..." 형태면 마지막 경로만 추출
      const finalSlug = extractBlogSlug(blogSlug);

      const _newBlog = await addBlog({
        profileId,
        blogName,
        blogSlug: finalSlug,
        isInfluencer,
        connectedBlogSlug,
      });
      setNewBlogs(_newBlog);
    } catch (error) {
      console.error("Error adding blog:", error);
    } finally {
      setIsSaving(false);
      setBlogName("");
      setBlogSlug("");
      setConnectedBlogSlug("");
      setIsInfluencer(false);
    }
  };

  const handleScrap = async () => {
    setIsScrapping(true);
    for (const newBlog of newBlogs) {
      if (!newBlog.id || !newBlog.blog_slug) {
        continue;
      }
      try {
        // 스크랩 후 새로운 블로그 정보로 업데이트
        const success = await scrapBlogAnalytics({
          blogId: newBlog.id,
          blogSlug: newBlog.blog_slug,
        });
        if (success) {
          console.log("Scrapped blog analytics successfully");
          setCompletedScrappedTrakers((prev) => prev + 1);
        } else {
          console.error("Failed to scrap blog analytics");
          setFailedScrappedBlogs((prev) => [...prev, newBlog.blog_slug]);
        }
        // 새로운 블로그 정보로 업데이트
        const newBlogWithAnalytics = await fetchSingleBlogsWithAnalytics(
          newBlog.id
        );
        setBlogsWithAnalytics((prev) => [...prev, newBlogWithAnalytics]);
        setIsOpen(false);
      } catch (error) {
        console.error("Error scrapping blog analytics:", error);
      } finally {
        setIsScrapping(false);
      }
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsInfluencer(checked);
  };

  useEffect(() => {
    if (newBlogs.length === 0) return;
    handleScrap();
  }, [newBlogs]);

  // 체크박스 여부에 따라 문구 동적 생성
  const titleText = isInfluencer ? "새 인플루언서 추가" : "새 블로그 추가";
  const descriptionText = isInfluencer
    ? "새 인플루언서 별칭과 인플루언서 주소(ID)를 입력하세요."
    : "새 블로그 별칭과 블로그 주소(ID)를 입력하세요.";

  const nameLabel = isInfluencer ? "인플루언서 별칭" : "블로그 별칭";
  const slugLabel = isInfluencer ? "인플루언서 주소/ID" : "블로그 주소/ID";
  const slugPlaceholder = isInfluencer
    ? "인플루언서 주소를 입력하세요. in.naver.com/~~~"
    : "블로그 주소/아이디를 입력하세요.";

  const tooltipContent = isInfluencer
    ? "인플루언서 주소를 주소창에서 복사해주시면 됩니다."
    : "블로그 주소를 주소창에서 복사해주시면 됩니다.";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          + 블로그 추가
        </Button>
      </SheetTrigger>
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

          {isInfluencer && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-1">
                <Label htmlFor="connectedBlogSlug">
                  인플루언서와 연결된 블로그
                </Label>
                <QuestionMarkTooltip
                  content={"인플루언서와 연결된 블로그의 주소를 입력해주세요."}
                />
              </div>
              <Input
                id="connectedBlogSlug"
                placeholder={"블로그 주소/아이디를 입력하세요."}
                value={connectedBlogSlug}
                onChange={(e) => setConnectedBlogSlug(e.target.value)}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
        <SheetFooter>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
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
        <Dialog open={isScrapping} onOpenChange={setIsScrapping}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>블로그 데이터를 스크래핑중입니다..</DialogTitle>
              <DialogDescription className="break-keep">
                {newBlogs.length} 개의 블로그 데이터를 스크래핑 중입니다. <br />
                많은 양의 데이터일수록 시간이 소요될 수 있습니다. 중간에
                나가시게 되면, 스크래핑이 중단됩니다.
              </DialogDescription>
            </DialogHeader>
            <Progress
              value={(completedScrappedTrakers / newBlogs.length) * 100}
            />
            {failedScrappedBlogs.length > 0 && (
              <div className="mt-4">
                <p>스크래핑 블록그</p>
                <ul>
                  {failedScrappedBlogs.map((blog, index) => (
                    <li key={index}>{blog}</li>
                  ))}
                </ul>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
