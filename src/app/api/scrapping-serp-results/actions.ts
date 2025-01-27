import { createClient } from "@supabase/supabase-js";
import { ZenRows } from "zenrows";
import * as cheerio from "cheerio";
import { getTodayInKST } from "@/utils/date";

// ZenRows API Key (환경 변수로 관리 권장)
const ZENROWS_API_KEY = process.env.ZENROW_API_KEY ?? "";
const zenrowsClient = new ZenRows(ZENROWS_API_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export interface SmartBlockItem {
  thumbnailImageUrl: string | null;
  siteName: string | null;
  siteUrl: string | null;
  isBlog: boolean;
  issueDate: string | null;
  postTitle: string | null;
  postUrl: string | null;
  postContent: string | null;
  postImageCount: number | null;
  rank: number;
}

export interface SmartBlock {
  title: string | null;
  items: SmartBlockItem[];
  moreButtonLink: string | null; // 더보기 최종 URL
  moreButtonRawLink: string | null; // 더보기에 실제로 쓰일 파라미터 링크
}

export interface PopularTopicItem {
  title: string | null;
  thumbnailImageUrl: string | null;
  detailSerpUrl: string | null;
}

export interface BasicBlock {
  title: string | null;
  items: SmartBlockItem[];
}

export interface SerpData {
  smartBlocks: SmartBlock[]; // fds-collection-root 등에서 추출한 스마트 블럭
  popularBlocks: SmartBlock[]; // "인기글" 블럭
  basicBlocks: BasicBlock[]; // 일반 블럭
  popularTopics: PopularTopicItem[]; // "인기주제" 정보
}

/**
 * ZenRows를 사용하여 URL의 HTML 데이터를 가져옴
 * @param url - 요청할 URL
 * @returns HTML 문자열 또는 null
 */
async function fetchHtmlWithZenRows(url: string): Promise<string | null> {
  console.log(`[FETCH] Fetching data from URL via ZenRows: ${url}`);
  try {
    const response = await zenrowsClient.get(url);
    if (!response.ok) {
      console.error(`[ERROR] Failed to fetch data: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[ERROR] ZenRows request failed: ${error}`);
    return null;
  }
}

/**
 * "더보기" 버튼을 통해 추가로 가져와야 할 데이터가 있을 때,
 * ZenRows를 사용하여 해당 데이터를 추출.
 *
 * @param moreButtonLink - 더보기 버튼 링크 (lb_api 포맷 등)
 * @returns 추가로 추출된 SmartBlockItem 목록
 */
async function fetchAllDetailSerpData(
  moreButtonLink: string,
): Promise<SmartBlockItem[]> {
  const start = 4; // 예시로 start=4로 잡아둠 (원하는 로직에 맞게 변경 가능)
  const items: SmartBlockItem[] = [];

  // 쿼리 파라미터를 활용하고 싶다면 아래 예시처럼 URL을 재구성
  const urlObj = new URL(moreButtonLink);
  urlObj.searchParams.set("start", start.toString());
  const finalUrl = urlObj.toString();

  console.log(`[FETCH] Fetching data (via ZenRows) from: ${finalUrl}`);

  try {
    // ZenRows 요청
    const response = await zenrowsClient.get(finalUrl);
    if (!response.ok) {
      console.error(`[ERROR] Failed to fetch data: ${response.status}`);
      return items;
    }

    // 더보기 API 응답이 JSON이라 가정
    const jsonString = await response.text();
    let jsonData: {
      log: {
        gvar: {
          g_query: string;
          g_tab: string;
          g_stab: string;
          g_ssc: string;
          g_puid: string;
          g_suid: string;
          g_crt: string;
        };
        fetchLog: string;
      };
      dom?: {
        header: {
          html: string;
        };
        collection?: { style: string; script: string; html: string }[];
        url: string;
      };
    } | null;
    try {
      jsonData = JSON.parse(jsonString);
    } catch (e) {
      console.error(`[ERROR] Failed to parse JSON: ${e}`);
      return items;
    }

    const collection = jsonData?.dom?.collection;
    if (!collection || !collection[0]?.html) {
      console.log("[INFO] No more data to fetch.");
      return items;
    }

    // HTML 파싱
    const html = collection[0].html;
    const $ = cheerio.load(html);

    $("div.fds-ugc-block-mod").each((index, itemElement) => {
      const thumbnailImageUrl =
        $(itemElement).find(".fds-thumb-small img").attr("src") || null;
      const siteName =
        $(itemElement).find(".fds-info-inner-text span").text() || null;
      const siteUrl =
        $(itemElement).find(".fds-info-inner-text").attr("href") || null;
      const isBlog = siteUrl?.includes("blog") ?? false;
      const issueDate =
        $(itemElement).find(".fds-info-sub-inner-text").text() || null;
      const postTitle =
        $(itemElement).find(".fds-comps-right-image-text-title span").text() ||
        null;
      const postUrl = $(itemElement)
        .find(".fds-comps-right-image-text-title")
        .attr("href") || null;
      const postContent = $(itemElement)
        .find(".fds-comps-right-image-text-content span")
        .text() || null;
      const postImageCountText = $(itemElement)
        .find(".fds-comps-right-image-content-image-badge span")
        .text();
      const postImageCount = postImageCountText
        ? parseInt(postImageCountText, 10)
        : null;
      const rank = index + start;

      items.push({
        thumbnailImageUrl,
        siteName,
        siteUrl,
        isBlog,
        issueDate,
        postTitle,
        postUrl,
        postContent,
        postImageCount,
        rank,
      });
    });

    console.log(`[INFO] Fetched ${items.length} additional items.`);
  } catch (error) {
    console.error(`[ERROR] Error while fetching or processing data: ${error}`);
  }

  return items;
}

/**
 * fds-collection-root 형태의 "스마트블럭"을 파싱하는 함수
 */
function parseSmartBlocks(
  $: cheerio.CheerioAPI,
  pageUrl: string,
): SmartBlock[] {
  const smartBlocks: SmartBlock[] = [];

  // 제외할 타이틀 키워드 설정
  const excludeValues = new Set([
    "VIEW",
    "뉴스",
    "FAQ",
    "지식iN",
    "지식백과",
    "플레이스",
    "이미지",
    "동영상",
    "파워링크",
    "연관 검색어",
    "비즈사이트",
    "네이버 도서",
    "방금 본 도서와 비슷한 도서",
    "카페 중고거래",
    "네이버쇼핑",
    "방금 본 상품 연관 추천",
    "국어사전",
    "함께 많이 찾는",
    "많이 본 지식백과",
    "오디오클립",
  ]);

  $("div.fds-collection-root").each((_, blockElement) => {
    const title =
      $(blockElement).find(".fds-comps-header-headline").text().trim() || null;
    if (!title || excludeValues.has(title)) return;

    const items: SmartBlockItem[] = [];

    $(blockElement)
      .find("div.fds-ugc-block-mod")
      .each((index, itemElement) => {
        const thumbnailImageUrl =
          $(itemElement).find(".fds-thumb-small img").attr("src") || null;
        const siteName =
          $(itemElement).find(".fds-info-inner-text span").text() || null;
        const siteUrl =
          $(itemElement).find(".fds-info-inner-text").attr("href") || null;
        const isBlog = siteUrl?.includes("blog") ?? false;
        const issueDate =
          $(itemElement).find(".fds-info-sub-inner-text").text() || null;
        const postTitle = $(itemElement)
          .find(".fds-comps-right-image-text-title span")
          .text() || null;
        const postUrl = $(itemElement)
          .find(".fds-comps-right-image-text-title")
          .attr("href") || null;
        const postContent = $(itemElement)
          .find(".fds-comps-right-image-text-content span")
          .text() || null;
        const postImageCountText = $(itemElement)
          .find(".fds-comps-right-image-content-image-badge span")
          .text();
        const postImageCount = postImageCountText
          ? parseInt(postImageCountText, 10)
          : null;
        const rank = index + 1;

        items.push({
          thumbnailImageUrl,
          siteName,
          siteUrl,
          isBlog,
          issueDate,
          postTitle,
          postUrl,
          postContent,
          postImageCount,
          rank,
        });
      });

    // 더보기 버튼 정보 추출
    const moreButtonRawLink = $(blockElement)
      .find(".fds-comps-footer-more-button-container")
      .attr("data-lb-trigger") || null;
    // 실제 URL로 만들기
    const moreButtonLink = moreButtonRawLink
      ? `${pageUrl}#lb_api=${moreButtonRawLink}`
      : null;

    smartBlocks.push({
      title,
      items,
      moreButtonLink,
      moreButtonRawLink,
    });
  });

  return smartBlocks;
}

/**
 * "인기글" 블럭을 추출하는 함수
 */
function parsePopularBlocks(
  $: cheerio.CheerioAPI,
  pageUrl: string,
): SmartBlock[] {
  const popularBlocks: SmartBlock[] = [];

  $("div.api_subject_bx").each((_, blockElement) => {
    const title = $(blockElement)
      .find(".mod_title_area > .title_wrap > .title")
      .text()
      .trim();

    // "인기글"이 아닌 경우 스킵
    if (!title.includes("인기글")) return;

    const items: SmartBlockItem[] = [];
    $(blockElement)
      .find(".view_wrap")
      .each((index, itemElement) => {
        const thumbnailImageUrl =
          $(itemElement).find(".user_thumb img").attr("src") || null;
        const siteName = $(itemElement).find(".user_info > a").text().trim() ||
          null;
        const siteUrl = $(itemElement).find("a.user_thumb").attr("href") ||
          null;
        const isBlog = siteUrl?.includes("blog") ?? false;
        const issueDate = $(itemElement).find(".user_info > span.sub").text() ||
          null;
        const postTitle = $(itemElement)
          .find(".title_area > a")
          .text()
          .trim() || null;
        const postUrl = $(itemElement)
          .find(".title_area > a")
          .attr("href") || null;
        const postContent = $(itemElement)
          .find(".dsc_area > a")
          .text()
          .trim() || null;
        const postImageCountText = $(itemElement)
          .find(".thumb_link > span")
          .text()
          .trim();
        const postImageCount = postImageCountText
          ? parseInt(postImageCountText, 10)
          : null;
        const rank = index + 1;

        items.push({
          thumbnailImageUrl,
          siteName,
          siteUrl,
          isBlog,
          issueDate,
          postTitle,
          postUrl,
          postContent,
          postImageCount,
          rank,
        });
      });

    const moreButtonRawLink =
      $(blockElement).find(".mod_more_wrap > a").attr("data-lb-trigger") ||
      null;
    const moreButtonLink = moreButtonRawLink
      ? `${pageUrl}#lb_api=${moreButtonRawLink}`
      : null;

    popularBlocks.push({
      title,
      items,
      moreButtonLink,
      moreButtonRawLink,
    });
  });

  return popularBlocks;
}

/**
 * "인기주제" (인기 검색어 등) 정보를 파싱하는 함수
 */
function parsePopularTopics($: cheerio.CheerioAPI): PopularTopicItem[] {
  const popularTopics: PopularTopicItem[] = [];

  // "인기주제"가 표시된 영역 찾기
  $("div.fds-collection-root").each((_, blockElement) => {
    const title =
      $(blockElement).find(".fds-comps-header-headline").text().trim() || "";

    if (title.includes("인기주제")) {
      $(blockElement)
        .find(".fds-comps-keyword-chip")
        .each((_, topicElement) => {
          const topicTitle =
            $(topicElement).find(".fds-comps-keyword-chip-text").text()
              .trim() ||
            null;
          const thumbnailImageUrl = $(topicElement)
            .find(".fds-comps-keyword-chip-image")
            .attr("src") || null;
          const detailSerpUrl = $(topicElement).attr("href") || null;

          if (topicTitle) {
            popularTopics.push({
              title: topicTitle,
              thumbnailImageUrl,
              detailSerpUrl,
            });
          }
        });
    }
  });

  return popularTopics;
}

/**
 * 일반 (기본) 블럭(예: VIEW 영역)을 파싱하는 함수
 */
function parseBasicBlocks($: cheerio.CheerioAPI): BasicBlock[] {
  const basicBlocks: BasicBlock[] = [];
  const firstBlockItems: SmartBlockItem[] = [];
  const secondBlockItems: SmartBlockItem[] = [];

  // 첫 번째 블럭
  $(".spw_rerank._rra_head li.bx").each((index, parentElement) => {
    const viewWrap = $(parentElement).find("div.view_wrap");
    if (viewWrap.length === 0) {
      return;
    }

    const thumbnailImageUrl = viewWrap.find(".user_thumb img").attr("src") ||
      null;
    const siteName = viewWrap.find(".user_info > a").text().trim() || null;
    const siteUrl = viewWrap.find("a.user_thumb").attr("href") || null;
    const isBlog = siteUrl?.includes("blog") ?? false;
    const issueDate = viewWrap.find(".user_info > span.sub").text().trim() ||
      null;
    const postTitle = viewWrap.find(".title_area > a").text().trim() || null;
    const postUrl = viewWrap.find(".title_area > a").attr("href") || null;
    const postContent = viewWrap.find(".dsc_area > a").text().trim() || null;
    const postImageCountText = viewWrap.find(".thumb_link > span.num").text()
      .trim();
    const postImageCount = postImageCountText
      ? parseInt(postImageCountText, 10)
      : null;
    const rank = index + 1;

    firstBlockItems.push({
      thumbnailImageUrl,
      siteName,
      siteUrl,
      isBlog,
      issueDate,
      postTitle,
      postUrl,
      postContent,
      postImageCount,
      rank,
    });
  });
  basicBlocks.push({
    title: "첫번째 블럭",
    items: firstBlockItems,
  });

  // 두 번째 블럭
  $(".spw_rerank._rra_body li.bx").each((index, parentElement) => {
    const viewWrap = $(parentElement).find("div.view_wrap");
    if (viewWrap.length === 0) {
      return;
    }

    const thumbnailImageUrl = viewWrap.find(".user_thumb img").attr("src") ||
      null;
    const siteName = viewWrap.find(".user_info > a").text().trim() || null;
    const siteUrl = viewWrap.find("a.user_thumb").attr("href") || null;
    const isBlog = siteUrl?.includes("blog") ?? false;
    const issueDate = viewWrap.find(".user_info > span.sub").text().trim() ||
      null;
    const postTitle = viewWrap.find(".title_area > a").text().trim() || null;
    const postUrl = viewWrap.find(".title_area > a").attr("href") || null;
    const postContent = viewWrap.find(".dsc_area > a").text().trim() || null;
    const postImageCountText = viewWrap.find(".thumb_link > span.num").text()
      .trim();
    const postImageCount = postImageCountText
      ? parseInt(postImageCountText, 10)
      : null;
    const rank = index + 1;

    secondBlockItems.push({
      thumbnailImageUrl,
      siteName,
      siteUrl,
      isBlog,
      issueDate,
      postTitle,
      postUrl,
      postContent,
      postImageCount,
      rank,
    });
  });
  basicBlocks.push({
    title: "두번째 블럭",
    items: secondBlockItems,
  });

  return basicBlocks;
}

/**
 * Fetch SERP results for a given keyword and process additional data from `moreButtonLink`.
 * @param keyword - The search keyword.
 * @returns {Promise<SerpData | null>} Parsed SERP data or null if an error occurs.
 */
export async function fetchSerpResults(
  keyword: string,
): Promise<SerpData | null> {
  console.log(`[ACTION] Fetching SERP results for keyword: ${keyword}`);

  const url = `https://search.naver.com/search.naver?query=${
    encodeURIComponent(
      keyword,
    )
  }`;

  // 1) 기본 HTML 가져오기
  const html = await fetchHtmlWithZenRows(url);
  if (!html) {
    console.error("[ERROR] Failed to fetch or process SERP results.");
    return null;
  }

  // 2) HTML 파싱 후, 각각의 블럭 추출
  const $ = cheerio.load(html);
  const smartBlocks = parseSmartBlocks($, url);
  const popularBlocks = parsePopularBlocks($, url);
  const popularTopics = parsePopularTopics($);
  const basicBlocks = parseBasicBlocks($);

  // 3) 스마트블럭 / 인기블럭 에 대해서 더보기 버튼이 있으면, 추가 데이터 수집
  for (const block of [...smartBlocks, ...popularBlocks]) {
    if (block.moreButtonRawLink) {
      console.log(`[INFO] Fetching additional data for block: ${block.title}`);
      // ZenRows를 사용하도록 수정한 함수
      const additionalItems = await fetchAllDetailSerpData(
        block.moreButtonRawLink,
      );
      if (additionalItems.length > 0) {
        block.items.push(...additionalItems);
      }
    }
  }

  // 4) 결과 리턴
  return {
    smartBlocks,
    popularBlocks,
    basicBlocks,
    popularTopics,
  };
}

/**
 * Save SERP results to the database.
 * @param keywordId - The ID of the keyword in the database.
 * @param serpData - The SERP data to save.
 * @returns {Promise<{ success: boolean; error?: string }>} Success or failure of the save operation.
 */
export async function saveSerpResults(
  keywordId: string,
  serpData: SerpData,
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ACTION] Saving SERP results for keyword ID: ${keywordId}`);

  const today = getTodayInKST();

  const { error: insertError } = await supabase.from("serp_results").insert({
    keyword_id: keywordId,
    date: today,
    smart_block_datas: serpData.smartBlocks,
    popular_block_datas: serpData.popularBlocks,
    popular_topic_datas: serpData.popularTopics,
    basic_block_datas: serpData.basicBlocks,
    smart_blocks: serpData.smartBlocks.map((block) => block.title),
    popular_blocks: serpData.popularBlocks.map((block) => block.title),
    popular_topics: serpData.popularTopics.map((topic) => topic.title),
  });

  if (insertError) {
    console.error("[ERROR] Failed to save SERP results:", insertError.message);
    return { success: false, error: insertError.message };
  }

  console.log("[SUCCESS] SERP results saved successfully.");
  return { success: true };
}
