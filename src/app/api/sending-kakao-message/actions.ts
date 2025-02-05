import { createClient } from "@supabase/supabase-js";
import { SolapiMessageService } from "solapi";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Solapi 설정 (환경변수로 설정)
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "YOUR_API_KEY";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "YOUR_API_SECRET";
const SOLAPI_FROM_NUMBER = process.env.SOLAPI_FROM_NUMBER || "등록된 발신번호";
const SOLAPI_PFID = process.env.SOLAPI_PFID || "연동한 비즈니스 채널의 pfId";
const SOLAPI_MESSAGE_SERVICE = new SolapiMessageService(
  SOLAPI_API_KEY,
  SOLAPI_API_SECRET,
);

// 메시지 내의 message 필드 타입
export interface MessageContent {
  project_id: string;
  phone_number: string;
}

// 큐 메시지 타입
export interface QueueMessage {
  msg_id: number;
  read_ct: number;
  enqueued_at: string; // ISO 8601 datetime string
  vt: string; // ISO 8601 datetime string
  message: MessageContent;
}

interface Tracker {
  id: string;
  keyword_id: string;
  keywords: {
    name: string;
  }; // 객체 타입으로 변경
}

type KeywordAnalysisResult = {
  monthly_search_volume: number;
};

/**
 * sendKakaoMessageAction
 * 1) 프로젝트 정보 가져오기 (slug, name)
 * 2) keyword_trackers 가져오기 (project_id, active=true) + keyword(name) 조인
 * 3) 모든 tracker의 어제 날짜의 keyword_tracker_results 조회 후 필터링
 * 4) 메시지 포맷 작성
 * 5) Solapi 친구톡 전송
 */
export async function sendKakaoMessageAction(
  projectId: string,
  phoneNumber: string,
) {
  try {
    // =============== (1) Project 정보 가져오기 ===============
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("slug, name")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error(
        "[ERROR] Failed to fetch project info:",
        projectError.message,
      );
      return { success: false, error: projectError.message };
    }

    const projectSlug = projectData?.slug ?? "demo-project";
    const projectName = projectData?.name ?? "Demo Project";

    // =============== (2) keyword_trackers 가져오기 ===============
    const { data: trackers, error: trackersError } = await supabase
      .from("keyword_trackers")
      .select("id, keyword_id, keywords(name)")
      .eq("project_id", projectId)
      .eq("active", true);

    if (trackersError) {
      console.error(
        "[ERROR] Failed to fetch keyword_trackers:",
        trackersError.message,
      );
      return { success: false, error: trackersError.message };
    }

    if (!trackers || trackers.length === 0) {
      console.log("[INFO] No active keyword_trackers found for this project.");
      return { success: false, error: "No active keyword_trackers found." };
    }

    console.log("[INFO] Found active keyword_trackers:", trackers);

    const trackersData = trackers as unknown as Tracker[];
    const validTrackers: Tracker[] = trackersData.map((tracker) => ({
      id: tracker.id,
      keyword_id: tracker.keyword_id,
      keywords: tracker.keywords,
    }));

    // console.log("[INFO] Found active keyword_trackers:", trackers);

    // 한국 시간대 설정
    const KST = "Asia/Seoul";

    // 현재 UTC 기준 시간을 한국시간으로 변환
    const nowInKST = toZonedTime(new Date(), KST);

    // 어제 날짜를 한국시간 기준으로 계산
    const yesterdayInKST = subDays(nowInKST, 1);

    // Supabase 쿼리용: yyyy-MM-dd 형식
    const dateString = formatInTimeZone(nowInKST, KST, "yyyy-MM-dd");
    // const dateString = formatInTimeZone(yesterdayInKST, KST, "yyyy-MM-dd");

    // 한국시간 기준 어제 날짜 포맷: MM/dd (요일)
    const yesterdayStr = formatInTimeZone(yesterdayInKST, KST, "MM/dd (EEE)", {
      locale: ko,
    });
    const todayStr = formatInTimeZone(nowInKST, KST, "MM/dd (EEE)", {
      locale: ko,
    });

    // =============== (3) 모든 tracker의 결과를 한 번의 쿼리로 가져오기 ===============
    const trackerIds = trackers.map((tracker) => tracker.id);
    // console.log("trackerIds", trackerIds);
    const { data: results, error: resultsError } = await supabase
      .from("keyword_tracker_results")
      .select(`
        id,
        keyword_tracker,
        rank_in_smart_block,
        smart_block_name,
        post_url,
        date
      `)
      .in("keyword_tracker", trackerIds)
      .eq("date", dateString); // 어제 날짜
    // console.log("results", results);

    if (resultsError) {
      console.error(
        "[ERROR] Failed to fetch keyword_tracker_results:",
        resultsError.message,
      );
      return { success: false, error: resultsError.message };
    }

    // =============== (4) 필터링 ===============
    const filteredResults: {
      keywordTracker: string;
      keywordName: string;
      smartBlock: string;
      rank: number;
    }[] = [];

    // trackerId를 키로 하는 keywordName 매핑
    const trackerIdToKeywordName: { [key: string]: string } = {};
    trackers?.forEach((tracker) => {
      // keywords를 객체로 단언하기 전에 unknown을 경유
      const keywords = tracker.keywords as unknown as { name: string };
      trackerIdToKeywordName[tracker.id] = keywords.name || "(Unknown Keyword)";
    });

    // 데이터 구조 확인을 위한 로깅
    // console.log("Trackers Data:", trackers);
    // console.log("Results Data:", results);

    for (const r of results || []) {
      const keywordName = trackerIdToKeywordName[r.keyword_tracker] ||
        "(Unknown Keyword)";
      const blockName = r.smart_block_name ?? "";
      const rank = r.rank_in_smart_block ?? -1;

      if (blockName.includes("인기글")) {
        if (rank > 0 && rank <= 7) {
          filteredResults.push({
            keywordName,
            smartBlock: blockName,
            rank,
            keywordTracker: r.keyword_tracker,
          });
        }
      } else {
        if (rank > 0 && rank <= 3) {
          filteredResults.push({
            keywordName,
            smartBlock: blockName,
            rank,
            keywordTracker: r.keyword_tracker,
          });
        }
      }
    }

    // console.log("filteredResults", filteredResults);

    // =============== (5) 키워드 분석 결과 가져오기 ===============
    let totalExposure = 0;
    for (const result of filteredResults) {
      const keywordTrackerId = result.keywordTracker;
      const tracker = validTrackers.find((t) => t.id === keywordTrackerId);
      if (!tracker) {
        console.warn(`[WARN] Tracker not found for ID: ${keywordTrackerId}`);
        continue;
      }

      const { data: keywordAnalysis, error: keywordAnalysisError } =
        await supabase
          .from("keyword_analytics")
          .select("daily_search_volume")
          .eq("keyword_id", tracker.keyword_id)
          .eq("date", dateString)
          .single();

      if (keywordAnalysisError) {
        console.error(
          "[ERROR] Failed to fetch keyword_analysis:",
          keywordAnalysisError.message,
        );
        return { success: false, error: keywordAnalysisError.message };
      }
      // console.log("result", result);
      // console.log("keywordAnalysis", keywordAnalysis);

      const dailySearchVolume = keywordAnalysis.daily_search_volume;
      totalExposure += dailySearchVolume;
    }
    // (트래커 총 개수)
    const totalTrackers = trackers.length;

    // =============== (5) 메시지 포맷 작성 ===============
    // [{projectName}] 어제MM/dd (요일) 상위노출 결과가 도착했어요 (이모지)
    // 총 키워드 X개 중에 Y개를 잡았어요. (Z%)
    //
    // 키워드 | 스마트블럭 | 순위
    // ...
    const successPercentage = ((filteredResults.length / totalTrackers) * 100)
      .toFixed(1);
    let messageText =
      `💌최블레포트\n[${projectName}] ${todayStr} 상위노출 결과가 도착했어요✨\n`;
    messageText +=
      `총 키워드 ${totalTrackers}개 중에 ${filteredResults.length}개의 포스팅이 첫번째 화면에 노출됐어요. (${successPercentage}%)\n\n오늘 해당 키워드로, 총 ${totalExposure}명에게 노출됐습니다.\n\n`;

    messageText += `\n👇상세데이터는 아래 링크에서 확인하세요.`;

    // =============== (6) Solapi 메시지 전송 ===============
    await SOLAPI_MESSAGE_SERVICE.send({
      to: phoneNumber,
      from: SOLAPI_FROM_NUMBER,
      text: messageText,
      kakaoOptions: {
        pfId: SOLAPI_PFID,
        buttons: [
          {
            buttonType: "WL",
            buttonName: "자세히 보기",
            linkMo: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${projectSlug}`,
            linkPc: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${projectSlug}`,
          },
        ],
      },
    });

    console.log(`[INFO] Kakao message sent successfully to ${phoneNumber}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[ERROR] Failed to send Kakao message:", err.message);
      return { success: false, error: err.message };
    } else {
      console.error("[ERROR] Failed to send Kakao message:", err);
      return { success: false, error: "Unknown error occurred." };
    }
  }
}
