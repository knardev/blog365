"use client";

// utils
import { createClient } from "@/utils/supabase/browser";
import { getTodayInKST } from "@/utils/date";
// hooks
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
// atoms
import {
  trackerTableDataAtom,
  trackerStatisticsAtom,
  strictModeAtom,
  visibleProjectsBlogsAtom,
  refreshTransactionAtom,
} from "@/features/tracker/atoms/states";
// actions
import { fetchKeywordTrackerWithResultsById } from "@/features/tracker/actions/fetch-single-keyword-tracker-results";
// types
import { DailyResult } from "@/features/tracker/types/types";

export function RefreshTrackerResultsRealtimeProvider() {
  // Supabase 클라이언트 생성
  const supabase = createClient();

  // Recoil 상태들
  const [refreshTransaction] = useRecoilState(refreshTransactionAtom);
  const [trackerTableData, setTrackerTableData] =
    useRecoilState(trackerTableDataAtom);
  const [trackerStatistics, setTrackerStatistics] = useRecoilState(
    trackerStatisticsAtom
  );
  const strictMode = useRecoilValue(strictModeAtom);
  const visibleProjectsBlogs = useRecoilValue(visibleProjectsBlogsAtom);

  /**
   * refreshTransaction이 있을 때만 realtime 구독을 설정
   * - keyword_tracker_results 테이블에 새로운 INSERT 이벤트가 발생하면,
   *   해당 tracker id를 추출하여 fetchKeywordTrackerWithResultsById를 호출하고,
   *   결과 데이터를 가공하여 Recoil 상태(trackerTableData, trackerStatistics)를 업데이트함.
   */
  useEffect(() => {
    if (!refreshTransaction) return; // active refresh transaction이 없으면 구독하지 않음

    const subscription = supabase
      .channel("keyword_tracker_results_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "keyword_tracker_results",
        },
        async (payload) => {
          // 새로 삽입된 row에서 tracker id 추출
          const inserted = payload.new;
          const trackerId = inserted.keyword_tracker;
          if (!trackerId) return;

          // 해당 tracker id에 대해 새로운 데이터를 fetch
          const mergedDataRow = await fetchKeywordTrackerWithResultsById({
            trackerId,
          });
          if (!mergedDataRow) {
            console.error(
              "Error fetching merged data row for tracker:",
              trackerId
            );
            return;
          }

          // 결과 데이터를 가공 (위의 refresh 로직 참고)
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

          // Recoil 상태 업데이트: 기존 데이터에 새 데이터를 추가
          setTrackerTableData((prev) => {
            const index = prev.findIndex(
              (item) => item.id === transformedData.id
            );
            if (index !== -1) {
              // 기존 tracker가 있으면 교체
              const newState = [...prev];
              newState[index] = transformedData;
              return newState;
            }
            return [...prev, transformedData];
          });

          setTrackerStatistics((prev) => {
            const index = prev.findIndex(
              (item) => item.id === transformedData.id
            );
            if (index !== -1) {
              const newState = [...prev];
              newState[index] = transformedData;
              return newState;
            }
            return [...prev, transformedData];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [
    refreshTransaction,
    supabase,
    setTrackerTableData,
    setTrackerStatistics,
    strictMode,
    visibleProjectsBlogs,
  ]);

  return null; // UI 렌더링 없이 provider 역할만 수행
}
