"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSetRecoilState, useRecoilValue } from "recoil";
// atoms
import {
  trackerTableDataAtom,
  trackerStatisticsAtom,
  strictModeAtom,
  visibleProjectsBlogsAtom,
  refreshTransactionAtom,
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
// actions
import { addKeywordTracker } from "@/features/tracker/actions/add-keyword-tracker";
import { fetchKeywordTrackerWithResultsById } from "@/features/tracker/actions/fetch-single-keyword-tracker-results";
import { scrapKeywordTrackerResult } from "@/features/tracker/actions/scrap-keyword-tracker-result";
import { addTrackerResultRefreshTransaction } from "@/features/tracker/actions/add-tracker-result-refresh-transaction";
import { sendMessageQueue } from "@/features/common/actions/send-message-queue";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import { AddKeywordTracker } from "@/features/tracker/queries/define-add-keyword-tracker";
import {
  DailyResult,
  KeywordTrackerTransformed,
} from "@/features/tracker/types/types";
// utils
import { getTodayInKST } from "@/utils/date";

export function KeywordTrackerAddSheet({
  projectSlug,
  keywordCategories,
}: {
  projectSlug: string;
  keywordCategories: KeywordCategories;
}) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 키워드 추가 관련 상태
  const [keywords, setKeywords] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 스크래핑 관련 상태
  const [newKeywordTrackers, setNewKeywordTrackers] = useState<
    AddKeywordTracker[]
  >([]);

  // recoil 상태
  const strictMode = useRecoilValue(strictModeAtom);
  const visibleProjectsBlogs = useRecoilValue(visibleProjectsBlogsAtom);
  const setTrackerTableData = useSetRecoilState(trackerTableDataAtom);
  const setTrackerStatistics = useSetRecoilState(trackerStatisticsAtom);
  const setRefreshTransaction = useSetRecoilState(refreshTransactionAtom);

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

  const registerScrap = useCallback(async () => {
    if (newKeywordTrackers.length === 0) return;
    const todayString = getTodayInKST();
    const newRefreshTransaction = await addTrackerResultRefreshTransaction({
      project_slug: projectSlug,
      refresh_date: todayString,
      total_count: newKeywordTrackers.length,
    });

    if (!newRefreshTransaction) {
      console.error("Error adding tracker result refresh transaction");
      return;
    }
    // 새로 생성한 refresh transaction을 atom에 저장
    setRefreshTransaction(newRefreshTransaction);

    // 메시지 큐에 보낼 tracker 데이터 구성
    const messages = newKeywordTrackers
      .filter(
        (tracker) =>
          tracker.project_id &&
          tracker.id &&
          tracker.keyword_id &&
          tracker.keywords?.name
      )
      .map((tracker) => ({
        projectId: tracker.project_id as string,
        trackerId: tracker.id,
        keywordId: tracker.keyword_id,
        keywordName: tracker.keywords!.name,
        refreshTransaction: newRefreshTransaction.id,
      }));

    if (messages.length === 0) return;

    try {
      const response = await sendMessageQueue({
        queueName: "refresh_tracker_result",
        messages,
      });
      if (response.success) {
        console.log(`${response.count} 개의 메시지가 큐에 등록되었습니다.`);

        // 각 tracker에 대해 mergedDataRow를 fetch 하여 변환 처리
        const transformedRows: KeywordTrackerTransformed[] = [];
        for (const tracker of newKeywordTrackers) {
          if (
            !tracker.project_id ||
            !tracker.id ||
            !tracker.keyword_id ||
            !tracker.keywords?.name
          )
            continue;
          const mergedDataRow = await fetchKeywordTrackerWithResultsById({
            trackerId: tracker.id,
          });
          if (!mergedDataRow) {
            console.error(
              "Error fetching merged data row for tracker",
              tracker.id
            );
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
          // daily_first_page_exposure 계산
          const todayStr = getTodayInKST();
          if (!resultsMap[todayStr]) {
            resultsMap[todayStr] = { catch_success: 0, catch_result: [] };
          }
          const dailySearchVolume =
            mergedDataRow.keyword_analytics?.daily_search_volume ?? 0;
          const todayCatchSuccess = resultsMap[todayStr].catch_success ?? 0;
          const dailyExposureSum = todayCatchSuccess * dailySearchVolume;
          const transformedData = {
            ...mergedDataRow,
            keyword_tracker_results: resultsMap,
            keyword_analytics: {
              ...mergedDataRow.keyword_analytics,
              daily_first_page_exposure: dailyExposureSum,
            },
          };
          transformedRows.push(transformedData);
        }

        // Recoil 상태 업데이트: tracker id가 이미 있으면 교체, 없으면 추가
        setTrackerTableData((prev) => {
          const updated = prev.map((existing) => {
            const replacement = transformedRows.find(
              (row) => row.id === existing.id
            );
            return replacement ? replacement : existing;
          });
          const newRows = transformedRows.filter(
            (row) => !prev.some((existing) => existing.id === row.id)
          );
          return [...updated, ...newRows];
        });
        setTrackerStatistics((prev) => {
          const updated = prev.map((existing) => {
            const replacement = transformedRows.find(
              (row) => row.id === existing.id
            );
            return replacement ? replacement : existing;
          });
          const newRows = transformedRows.filter(
            (row) => !prev.some((existing) => existing.id === row.id)
          );
          return [...updated, ...newRows];
        });
      }
    } catch (error) {
      console.error("메시지 큐 전송 중 에러:", error);
    } finally {
      setNewKeywordTrackers([]);
      setIsSheetOpen(false);
      setKeywords("");
      setSelectedCategory(null);
    }
  }, [
    newKeywordTrackers,
    projectSlug,
    setRefreshTransaction,
    setTrackerTableData,
    setTrackerStatistics,
    strictMode,
    visibleProjectsBlogs,
  ]);

  useEffect(() => {
    if (newKeywordTrackers.length > 0) {
      registerScrap();
    }
  }, [newKeywordTrackers, registerScrap]);

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
