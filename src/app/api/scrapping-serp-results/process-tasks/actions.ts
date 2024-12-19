import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

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

interface SmartBlockItem {
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

interface SmartBlock {
  title: string | null;
  items: SmartBlockItem[];
  moreButtonLink: string | null;
  moreButtonRawLink: string | null;
}

interface PopularTopicItem {
  title: string | null;
  thumbnailImageUrl: string | null;
  detailSerpUrl: string | null;
}

interface SerpData {
  smartBlocks: SmartBlock[];
  popularTopics: PopularTopicItem[];
  basicBlock: SmartBlockItem[];
}

/**
 * Fetch and parse all data from the moreButtonLink.
 * @param moreButtonLink - The URL to fetch data from.
 * @returns A list of SmartBlockItem objects.
 */
async function fetchAllDetailSerpData(
  moreButtonLink: string,
): Promise<SmartBlockItem[]> {
  const start = 4;
  const items: SmartBlockItem[] = [];

  // Construct the URL with the updated start parameter
  const url = new URL(moreButtonLink);
  url.searchParams.set("start", start.toString());

  console.log(`[FETCH] Fetching data from URL: ${url}`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`[ERROR] Failed to fetch data: ${response.status}`);
    }

    const json = await response.json();
    const collection = json?.dom?.collection || json?.collection;

    if (!collection || !collection[0]?.html) {
      console.log("[INFO] No more data to fetch.");
    }

    // Parse the HTML to extract SmartBlockItems
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

    console.log(`[INFO] Fetched ${items.length} items so far.`);
  } catch (error) {
    console.error(
      `[ERROR] Error while fetching or processing data: ${error}`,
    );
  }

  return items;
}

function extractSmartBlocks(
  html: string,
  url: string,
): {
  smartBlocks: SmartBlock[];
  popularTopics: PopularTopicItem[];
  basicBlock: SmartBlockItem[];
} {
  const $ = cheerio.load(html);
  const smartBlocks: SmartBlock[] = [];
  const popularTopics: PopularTopicItem[] = [];

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

  // Process `fds-collection-root` blocks
  $("div.fds-collection-root").each((_, blockElement) => {
    const title =
      $(blockElement).find(".fds-comps-header-headline").text().trim() || null;

    // Skip excluded titles
    if (!title || excludeValues.has(title)) return;

    // Process Popular Topics
    if (title.includes("인기주제")) {
      $(blockElement)
        .find(".fds-comps-keyword-chip")
        .each((_, topicElement) => {
          const topicTitle = $(topicElement)
            .find(".fds-comps-keyword-chip-text")
            .text()
            .trim() || null;
          const thumbnailImageUrl = $(topicElement)
            .find(".fds-comps-keyword-chip-image")
            .attr("src") || null;
          const detailSerpUrl = $(topicElement).attr("href") ||
            null;

          if (topicTitle) {
            popularTopics.push({
              title: topicTitle,
              thumbnailImageUrl,
              detailSerpUrl,
            });
          }
        });
      return;
    }

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

    // Extract `moreButtonLink` for the Smart Block
    const moreButtonRawLink = $(blockElement)
      .find(".fds-comps-footer-more-button-container")
      .attr("data-lb-trigger") || null;
    const moreButtonLink = `${url}#lb_api=${moreButtonRawLink}`;

    // Add the Smart Block to the list
    smartBlocks.push({ title, items, moreButtonLink, moreButtonRawLink });
  });

  // Process `api_subject_bx` blocks with "인기글" in the title
  $("div.api_subject_bx").each((_, blockElement) => {
    const title = $(blockElement)
      .find(".mod_title_area > .title_wrap > .title")
      .text()
      .trim();

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
        const postUrl = $(itemElement).find(".title_area > a").attr("href") ||
          null;
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

    const moreButtonRawLink = $(blockElement)
      .find(".mod_more_wrap > a")
      .attr("data-lb-trigger") || null;
    const moreButtonLink = moreButtonRawLink
      ? `${url}#lb_api=${moreButtonRawLink}`
      : null;

    smartBlocks.push({ title, items, moreButtonLink, moreButtonRawLink });
  });

  // Process `total_wrap` blocks for basic blocks
  const basicBlockItems: SmartBlockItem[] = [];

  $(".spw_rerank.type_head._rra_head li.bx").each((index, parentElement) => {
    const viewWrap = $(parentElement).find("div.view_wrap");

    // Skip this block if `div.view_wrap` is not found
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

    const rank = index + 1; // Assign the rank based on the parent element's index

    basicBlockItems.push({
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

  return { smartBlocks, popularTopics, basicBlock: basicBlockItems };
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

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`[ERROR] Failed to fetch SERP results: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const { smartBlocks, popularTopics, basicBlock } = extractSmartBlocks(
      html,
      url,
    );

    // Fetch additional data for each SmartBlock's moreButtonLink
    for (const block of smartBlocks) {
      if (block.moreButtonLink) {
        console.log(
          `[INFO] Fetching additional data for block: ${block.title}`,
        );
        if (block.title?.includes("인기글")) {
          continue;
        }
        const additionalItems = await fetchAllDetailSerpData(
          block.moreButtonRawLink ?? "",
        );
        block.items.push(...additionalItems); // Append additional items to the block
      }
    }

    return {
      smartBlocks,
      popularTopics,
      basicBlock,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to process SERP results: ${(error as Error).message}`,
    );
    return null;
  }
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

  const today = new Date().toISOString().split("T")[0];

  const { data: existingResult, error: existingError } = await supabase
    .from("serp_results")
    .select("*")
    .eq("keyword_id", keywordId)
    .eq("date", today)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    console.error(
      "[ERROR] Failed to check existing SERP results:",
      existingError.message,
    );
    return { success: false, error: existingError.message };
  }

  if (existingResult) {
    console.log(
      `[INFO] SERP results already exist for keyword ID: ${keywordId}`,
    );
    return { success: true }; // Skip saving if already exists
  }

  const { error: insertError } = await supabase.from("serp_results").insert({
    keyword_id: keywordId,
    date: today,
    smart_block_datas: serpData.smartBlocks,
    popular_topic_datas: serpData.popularTopics,
    basic_block_datas: serpData.basicBlock,
    smart_blocks: serpData.smartBlocks.map((block) => block.title),
    popular_topics: serpData.popularTopics.map((topic) => topic.title),
  });

  if (insertError) {
    console.error("[ERROR] Failed to save SERP results:", insertError.message);
    return { success: false, error: insertError.message };
  }

  console.log("[SUCCESS] SERP results saved successfully.");
  return { success: true };
}
