"use client";

import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { createClient } from "@/utils/supabase/browser";
import { getTodayInKST } from "@/utils/date";

// atoms
import {
  refreshTransactionAtom,
  trackerTableDataAtom,
} from "@/features/tracker/atoms/states";

// components
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Send } from "lucide-react";

// actions (서버 액션 함수 직접 호출)
import { fetchTrackerResultRefreshActiveTransaction } from "@/features/tracker/actions/fetch-tracker-result-refresh-active-transaction";
import { addTrackerResultRefreshTransaction } from "@/features/tracker/actions/add-tracker-result-refresh-transaction";
import { sendMessageQueue } from "@/features/common/actions/send-message-queue";
// types
import { Tables } from "@/types/database.types";

export function RefreshButton({ projectSlug }: { projectSlug: string }) {
  const [refreshTransaction, setRefreshTransaction] = useRecoilState(
    refreshTransactionAtom
  );
  const trackerData = useRecoilValue(trackerTableDataAtom);
  const [remainingText, setRemainingText] = useState("");
  const supabase = createClient();

  /**
   * 컴포넌트 마운트 시 active transaction을 서버 액션에서 가져와 recoil에 저장
   */
  useEffect(() => {
    async function fetchActiveTransaction() {
      try {
        const transaction = await fetchTrackerResultRefreshActiveTransaction({
          project_slug: projectSlug,
        });
        if (transaction) {
          setRefreshTransaction(transaction);
        }
      } catch (error) {
        console.error("Error fetching active transaction", error);
      }
    }
    fetchActiveTransaction();
  }, [projectSlug, setRefreshTransaction]);

  /**
   * Realtime 구독: refreshTransaction이 업데이트될 때 남은 개수를 자동 업데이트.
   * 만약 업데이트된 데이터의 active가 false이면 refreshTransaction을 초기화.
   */
  useEffect(() => {
    if (refreshTransaction) {
      const totalCount = refreshTransaction.total_count ?? 0;
      const currentCount = refreshTransaction.current_count ?? 0;
      setRemainingText(`전체 ${totalCount} 개 중 ${currentCount} 개 진행중`);

      const subscription = supabase
        .channel("tracker_refresh")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tracker_result_refresh_transactions",
            filter: `id=eq.${refreshTransaction.id}`,
          },
          (payload) => {
            const updated =
              payload.new as Tables<"tracker_result_refresh_transactions">;
            // 만약 active가 false이면 refresh transaction 초기화
            if (updated.active === false) {
              setRefreshTransaction(null);
              setRemainingText("");
              return;
            }
            // active가 true이면 상태 업데이트
            setRefreshTransaction(updated);
            const total = updated.total_count ?? 0;
            const current = updated.current_count ?? 0;
            setRemainingText(`전체 ${total} 개 중 ${current} 개 진행중`);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [refreshTransaction, setRefreshTransaction, supabase]);

  /**
   * 버튼 클릭 핸들러:
   * - refreshTransaction이 있으면 바로 return하여 중복 실행 방지
   * - 없으면, tracker 데이터로 새로운 refresh transaction을 생성하고,
   *   각 tracker 데이터를 메시지 큐에 등록함.
   */
  const handleRefreshClick = async () => {
    if (refreshTransaction) return; // active transaction이 있으면 아무 작업도 하지 않음

    const todayString = getTodayInKST();
    let newTransaction;
    try {
      // trackerData 배열 길이를 total_count로 설정
      newTransaction = await addTrackerResultRefreshTransaction({
        project_slug: projectSlug,
        refresh_date: todayString,
        total_count: trackerData.length,
      });
      if (newTransaction) {
        setRefreshTransaction(newTransaction);
      }
    } catch (error) {
      console.error("Error creating new refresh transaction", error);
      return;
    }

    // 새로 생성된 refresh transaction의 id를 각 tracker 데이터에 넣어서 메시지 큐에 등록
    const messages = trackerData
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
        refreshTransaction: newTransaction.id,
      }));

    if (messages.length === 0) return;

    try {
      const response = await sendMessageQueue({
        queueName: "refresh_tracker_result",
        messages,
      });
      if (response.success) {
        console.log(`${response.count} 개의 메시지가 큐에 등록되었습니다.`);
      }
    } catch (error) {
      console.error("메시지 큐 전송 중 에러:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <TooltipRoot defaultOpen={true}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleRefreshClick}>
              <div className="flex items-center">
                {refreshTransaction ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2" />
                    데이터 새로고침 중
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    데이터 새로고침
                  </>
                )}
              </div>
            </Button>
          </TooltipTrigger>
          {refreshTransaction && (
            <TooltipContent side="top">
              <p>{remainingText}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipRoot>
    </TooltipProvider>
  );
}
