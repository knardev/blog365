"use client";

// hooks
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSetRecoilState, useRecoilValue } from "recoil";
// atoms
import {
  trackerTableDataAtom,
  trackerStatisticsAtom,
  strictModeAtom,
  visibleProjectsBlogsAtom,
} from "@/features/tracker/atoms/states";
// components
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Progress } from "@/components/ui/progress";
// actions
import { addKeywordTracker } from "@/features/tracker/actions/add-keyword-tracker";
import { fetchKeywordTrackerWithResultsById } from "@/features/tracker/actions/fetch-single-keyword-tracker-results";
import { scrapKeywordTrackerResult } from "@/features/tracker/actions/scrap-keyword-tracker-result";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import { AddKeywordTracker } from "@/features/tracker/queries/define-add-keyword-tracker";
import { DailyResult } from "@/features/tracker/types/types";
import { getTodayInKST } from "@/utils/date";

export function KeywordTrackerAddSheet({
  projectSlug,
  keywordCategories,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories;
}) {
  const router = useRouter(); // useRouter 훅 사용
  const [isSheetOpen, setIsSheetOpen] = useState(false); // 시트 열림 여부

  // 키워드 추가 시 필요한 상태들
  const [keywords, setKeywords] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // DB에 저장하는 중인지 여부

  // 스크래핑 관련 상태들
  const [isScrapping, setIsScrapping] = useState(false);
  const [newKeywordTrackers, setNewKeywordTrackers] = useState<
    AddKeywordTracker[]
  >([]);
  const [completedScrappedTrakers, setCompletedScrappedTrakers] = useState(0);
  const [failedScrappedTrakers, setFailedScrappedTrakers] = useState<string[]>(
    []
  );

  // 프론트 상태 업데이트를 위한 recoil hook 사용
  const strictMode = useRecoilValue(strictModeAtom);
  const visibleProjectsBlogs = useRecoilValue(visibleProjectsBlogsAtom);
  const setTrackerTableData = useSetRecoilState(trackerTableDataAtom);
  const setTrackerStatistics = useSetRecoilState(trackerStatisticsAtom);

  const handleSave = async () => {
    if (!keywords.trim()) return;
    setIsSaving(true);
    try {
      const _newKeywordTrackers = await addKeywordTracker({
        projectSlug,
        keywords,
        categoryId: selectedCategory || undefined,
      });
      setNewKeywordTrackers(_newKeywordTrackers);
    } catch (error) {
      console.error("Error adding keyword tracker:", error);
    } finally {
      setIsSaving(false);
      setKeywords("");
      setSelectedCategory(null);
    }
  };

  const handleScrap = async () => {
    if (isScrapping) return;
    setIsScrapping(true);
    for (const tracker of newKeywordTrackers) {
      if (
        !tracker.project_id ||
        !tracker.id ||
        !tracker.keyword_id ||
        !tracker.keywords?.name
      ) {
        if (!tracker.keywords?.name) {
          setFailedScrappedTrakers((prev) => [...prev, "키워드 미상"]);
        } else {
          setFailedScrappedTrakers((prev) => [
            ...prev,
            tracker.keywords?.name as string,
          ]);
        }
        continue;
      }

      const success = await scrapKeywordTrackerResult({
        projectId: tracker.project_id || "",
        trackerId: tracker.id,
        keywordId: tracker.keyword_id,
        keywordName: tracker.keywords?.name,
      });

      if (success) {
        setCompletedScrappedTrakers((prev) => prev + 1);
      } else {
        setFailedScrappedTrakers((prev) => [
          ...prev,
          tracker.keywords?.name as string,
        ]);
      }

      const mergedDataRow = await fetchKeywordTrackerWithResultsById({
        trackerId: tracker.id,
      });
      if (!mergedDataRow) {
        console.error("Error fetching merged data row");
        continue;
      }

      const maxRankPopular = strictMode ? 2 : 7;
      const maxRankNormal = strictMode ? 2 : 3;
      const resultsMap: Record<string, DailyResult> = {};
      mergedDataRow.raw_results.forEach((result) => {
        const date = result.date;
        if (!resultsMap[date]) {
          resultsMap[date] = { catch_success: 0, catch_result: [] };
        }

        const isPopularPost =
          result.smart_block_name?.includes("인기글") ?? false;

        if (result.blog_id) {
          if (
            visibleProjectsBlogs.includes(result.blog_id) &&
            result.rank_in_smart_block !== null &&
            result.rank_in_smart_block <=
              (isPopularPost ? maxRankPopular : maxRankNormal)
          ) {
            resultsMap[date].catch_success += 1;
          }
        }

        resultsMap[date].catch_result.push({
          post_url: result.post_url ?? "N/A",
          smart_block_name: result.smart_block_name ?? "N/A",
          rank_in_smart_block: result.rank_in_smart_block ?? -1,
        });

        resultsMap[date].catch_result.sort(
          (a, b) => a.rank_in_smart_block - b.rank_in_smart_block
        );
      });

      // 3) Calculate daily_first_page_exposure
      //    daily_first_page_exposure = SUM of (catch_success * daily_search_volume) over all dates
      const todayString = getTodayInKST();
      if (!resultsMap[todayString]) {
        resultsMap[todayString] = { catch_success: 0, catch_result: [] };
      }
      const dailySearchVolume =
        mergedDataRow.keyword_analytics?.daily_search_volume ?? 0;
      const todayCatchSuccess = resultsMap[todayString].catch_success ?? 0;
      const dailyExposureSum = todayCatchSuccess * dailySearchVolume;

      const transformedData = {
        ...mergedDataRow,
        keyword_tracker_results: resultsMap,
        keyword_analytics: {
          ...mergedDataRow.keyword_analytics,
          daily_first_page_exposure: dailyExposureSum,
        },
      };
      setTrackerTableData((prev) => [...prev, transformedData]);
      setTrackerStatistics((prev) => [...prev, transformedData]);
    }
    setIsScrapping(false);
    setNewKeywordTrackers([]);
    setCompletedScrappedTrakers(0);
    setFailedScrappedTrakers([]);
    setIsSheetOpen(false);
    setKeywords("");
    setSelectedCategory(null);
  };

  useEffect(() => {
    if (newKeywordTrackers.length > 0) handleScrap();
  }, [newKeywordTrackers, handleScrap]);

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
        <Dialog open={isScrapping} onOpenChange={setIsScrapping}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>키워드 데이터를 스크래핑중입니다..</DialogTitle>
              <DialogDescription className="break-keep">
                {newKeywordTrackers.length} 개의 키워드 데이터를 스크래핑
                중입니다. <br />
                많은 양의 데이터일수록 시간이 소요될 수 있습니다. 중간에
                나가시게 되면, 스크래핑이 중단됩니다.
              </DialogDescription>
            </DialogHeader>
            <Progress
              value={
                (completedScrappedTrakers / newKeywordTrackers.length) * 100
              }
            />
            {failedScrappedTrakers.length > 0 && (
              <div className="mt-4">
                <p>스크래핑 실패한 키워드</p>
                <ul>
                  {failedScrappedTrakers.map((keyword, index) => (
                    <li key={index}>{keyword}</li>
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
