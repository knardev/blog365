import { createClient } from "@supabase/supabase-js";
import { SolapiMessageService } from "solapi";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";

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
    // keyword_id -> keyword(name) 조인
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

    // 어제 날짜 포맷: MM/dd (요일) (예: 04/26 (금))
    const yesterday = subDays(new Date(), 1);
    const dateString = format(yesterday, "yyyy-MM-dd"); // Supabase 쿼리용
    const yesterdayStr = format(yesterday, "MM/dd (EEE)", { locale: ko });

    // =============== (3) 모든 tracker의 결과를 한 번의 쿼리로 가져오기 ===============
    const trackerIds = trackers.map((tracker) => tracker.id);
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

    if (resultsError) {
      console.error(
        "[ERROR] Failed to fetch keyword_tracker_results:",
        resultsError.message,
      );
      return { success: false, error: resultsError.message };
    }

    // =============== (4) 필터링 ===============
    const filteredResults: {
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

      if (blockName === "인기글") {
        if (rank > 0 && rank <= 7) {
          filteredResults.push({
            keywordName,
            smartBlock: blockName,
            rank,
          });
        }
      } else {
        if (rank > 0 && rank <= 3) {
          filteredResults.push({
            keywordName,
            smartBlock: blockName,
            rank,
          });
        }
      }
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
      `💌최블레포트\n[${projectName}] ${yesterdayStr} 상위노출 결과가 도착했어요✨\n`;
    messageText +=
      `총 키워드 ${totalTrackers}개 중에 ${filteredResults.length}개의 포스팅이 첫번째 화면에 노출됐어요. (${successPercentage}%)\n\n`;
    messageText += `키워드 | 스마트블럭 | 순위\n`;

    if (filteredResults.length === 0) {
      messageText += `- (조건에 맞는 결과가 없습니다.)\n`;
    } else {
      for (const item of filteredResults) {
        messageText +=
          `${item.keywordName} | ${item.smartBlock} | ${item.rank}\n`;
      }
    }

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
            linkMo:
              `${process.env.NEXT_PUBLIC_SITE_URL}/${projectSlug}/tracker`,
            linkPc:
              `${process.env.NEXT_PUBLIC_SITE_URL}/${projectSlug}/tracker`,
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
