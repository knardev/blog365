import { createClient } from "@supabase/supabase-js";

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary);
}

async function generateHmacSignature(
  secretKey: string,
  message: string,
): Promise<string> {
  console.log("[ACTION] Generating HMAC signature...");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const hmac = arrayBufferToBase64(signature);
  console.log("[SUCCESS] HMAC signature generated.");
  return hmac;
}

// Define types
type NaverKeywordResult = {
  relKeyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  monthlyAvePcClkCnt: number;
  monthlyAveMobileClkCnt: number;
  monthlyAvePcCtr: number;
  monthlyAveMobileCtr: number;
  plAvgDepth: number;
  compIdx: string;
};

type ProcessedKeywordData = {
  monthlySearchVolume: number;
  dailySearchVolume: number;
  monthlyPcSearchVolume: number;
  monthlyMobileSearchVolume: number;
  dailyPcSearchVolume: number;
  dailyMobileSearchVolume: number;
  monthlyIssueVolume: number;
  dailyIssueVolume: number;
};

// Function to fetch blog posts for a given date range
export async function getBlogSearchPage(
  query: string,
  startDate: string,
  endDate: string,
): Promise<number | null> {
  console.log(`[INFO] Fetching blog post count for query: ${query}`);
  const url =
    `https://section.blog.naver.com/ajax/SearchList.naver?countPerPage=7&currentPage=1&endDate=${endDate}&keyword=${
      encodeURIComponent(query)
    }&orderBy=sim&startDate=${startDate}&type=post`;
  console.log(`[DEBUG] URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Referer: "https://section.blog.naver.com/Search/Post.naver",
      },
    });

    if (!response.ok) {
      console.error(`[ERROR] Failed to fetch blog posts: ${response.status}`);
      return null;
    }

    const content = await response.text();
    const jsonStartIndex = content.indexOf("{");
    if (jsonStartIndex === -1) {
      console.error("[ERROR] No valid JSON found in the response.");
      return null;
    }

    const json = JSON.parse(content.slice(jsonStartIndex));
    const totalPosts = json.result?.totalCount || 0;

    console.log(`[INFO] Blog post count for query "${query}": ${totalPosts}`);
    return totalPosts;
  } catch (error) {
    console.error("[ERROR] Failed to parse blog post data:", error);
    return null;
  }
}

// Function to calculate blog metrics
export async function calculateBlogMetrics(
  keyword: string,
): Promise<{ monthlyIssueVolume: number; dailyIssueVolume: number } | null> {
  console.log(`[ACTION] Calculating blog metrics for keyword: ${keyword}`);

  const today = new Date();
  const gmtEndDate = today.toISOString().split("T")[0];
  const gmtStartDate =
    new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      .toISOString()
      .split("T")[0];
  const gmtYesterday =
    new Date(today.getTime() - 86400000).toISOString().split("T")[0];

  console.log(
    `[INFO] Start Date: ${gmtStartDate}, End Date: ${gmtEndDate}, Yesterday: ${gmtYesterday}`,
  );

  const monthlyIssueVolume = await getBlogSearchPage(
    keyword,
    gmtStartDate,
    gmtEndDate,
  );
  const yesterdayVolume = await getBlogSearchPage(
    keyword,
    gmtStartDate,
    gmtYesterday,
  );

  if (monthlyIssueVolume === null || yesterdayVolume === null) {
    console.warn(`[WARN] Could not fetch blog metrics for keyword: ${keyword}`);
    return null;
  }

  const dailyIssueVolume = monthlyIssueVolume - yesterdayVolume;

  console.log(
    `[INFO] Monthly Issue Volume: ${monthlyIssueVolume}, Daily Issue Volume: ${dailyIssueVolume}`,
  );

  return {
    monthlyIssueVolume,
    dailyIssueVolume,
  };
}

export async function processKeywordData(
  keyword: string,
): Promise<ProcessedKeywordData | null> {
  console.log(`[ACTION] Processing keyword data for: ${keyword}`);

  const apiUrl = "https://api.naver.com/keywordstool";
  const apiKey = process.env.NAVER_API_KEY;
  const customerId = process.env.NAVER_CUSTOMER_ID;
  const secretKey = process.env.NAVER_SECRET_KEY;

  if (!apiKey || !customerId || !secretKey) {
    console.error("[ERROR] NAVER API credentials are not configured.");
    throw new Error("NAVER API credentials are not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const method = "GET";
  const uri = "/keywordstool";

  const message = `${timestamp}.${method}.${uri}`;
  const hmac = await generateHmacSignature(secretKey, message);

  const headers = {
    "X-Timestamp": timestamp.toString(),
    "X-API-KEY": apiKey,
    "X-Customer": customerId,
    "X-Signature": hmac,
  };

  const params = new URLSearchParams({
    hintKeywords: keyword,
    showDetail: "1",
  });

  console.log("[INFO] Sending request to NAVER API...");
  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "[ERROR] Failed to fetch keyword data:",
      response.status,
      errorText,
    );
    return null;
  }

  const data = await response.json();
  console.log("[INFO] Response received from NAVER API.");

  if (!data.keywordList || data.keywordList.length === 0) {
    console.warn(`[WARN] No keyword data found for: ${keyword}`);
    return null;
  }

  const result: NaverKeywordResult = data.keywordList[0];

  const monthlyPcSearchVolume = result.monthlyPcQcCnt || 0;
  const monthlyMobileSearchVolume = result.monthlyMobileQcCnt || 0;
  const monthlySearchVolume = monthlyPcSearchVolume + monthlyMobileSearchVolume;

  const dailyPcSearchVolume = Math.floor(monthlyPcSearchVolume / 30);
  const dailyMobileSearchVolume = Math.floor(monthlyMobileSearchVolume / 30);
  const dailySearchVolume = dailyPcSearchVolume + dailyMobileSearchVolume;

  const issueMetrics = await calculateBlogMetrics(keyword);
  if (!issueMetrics) {
    console.warn(`[WARN] No blog post data found for: ${keyword}`);
    return null;
  }
  const { monthlyIssueVolume, dailyIssueVolume } = issueMetrics;

  console.log("[SUCCESS] Keyword data processed successfully.");
  return {
    monthlySearchVolume,
    dailySearchVolume,
    monthlyPcSearchVolume,
    monthlyMobileSearchVolume,
    dailyPcSearchVolume,
    dailyMobileSearchVolume,
    monthlyIssueVolume,
    dailyIssueVolume,
  };
}

export async function saveKeywordAnalytics(
  keyword: string,
  searchData: ProcessedKeywordData,
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ACTION] Saving analytics data for keyword: ${keyword}`);

  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Fetch the keyword from the `keywords` table
  const { data: keywordData, error: keywordError } = await supabase
    .from("keywords")
    .select("id")
    .eq("name", keyword)
    .single();

  if (keywordError && keywordError.code !== "PGRST116") {
    console.error(
      "[ERROR] Failed to fetch keyword from database:",
      keywordError.message,
    );
    return { success: false, error: keywordError.message };
  }

  let keywordId = keywordData?.id;

  // If the keyword does not exist, insert it
  if (!keywordId) {
    console.log(
      `[INFO] Keyword not found in database. Inserting new keyword: ${keyword}`,
    );
    const { data: newKeyword, error: insertError } = await supabase
      .from("keywords")
      .insert({ name: keyword })
      .select()
      .single();

    if (insertError) {
      console.error(
        "[ERROR] Failed to insert new keyword:",
        insertError.message,
      );
      return { success: false, error: insertError.message };
    }

    keywordId = newKeyword.id;
    console.log("[SUCCESS] New keyword inserted into database.");
  }

  // Check if analytics data for the same keyword and date already exists
  console.log(
    `[INFO] Checking if analytics data already exists for keyword ID: ${keywordId} and date: ${today}`,
  );
  const { data: existingAnalytics, error: existingError } = await supabase
    .from("keyword_analytics")
    .select("*")
    .eq("keyword_id", keywordId)
    .eq("date", today)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    console.error(
      "[ERROR] Failed to check existing analytics data:",
      existingError.message,
    );
    return { success: false, error: existingError.message };
  }

  if (existingAnalytics) {
    console.log(
      `[INFO] Analytics data already exists for keyword ID: ${keywordId} and date: ${today}`,
    );
    return { success: true }; // Return success if analytics already exists
  }

  // Insert new analytics data
  console.log(
    "[INFO] Inserting analytics data into `keyword_analytics` table...",
  );
  const { error: analyticsError } = await supabase.from("keyword_analytics")
    .insert({
      keyword_id: keywordId,
      date: today,
      montly_search_volume: searchData.monthlySearchVolume,
      daily_search_volume: searchData.dailySearchVolume,
      montly_mobile_search_volume: searchData.monthlyMobileSearchVolume,
      montly_pc_search_volume: searchData.monthlyPcSearchVolume,
      daily_mobile_search_volume: searchData.dailyMobileSearchVolume,
      daily_pc_search_volume: searchData.dailyPcSearchVolume,
      montly_issue_volume: searchData.monthlyIssueVolume,
      daily_issue_volume: searchData.dailyIssueVolume,
    });

  if (analyticsError) {
    console.error(
      "[ERROR] Failed to insert analytics data:",
      analyticsError.message,
    );
    return { success: false, error: analyticsError.message };
  }

  console.log("[SUCCESS] Analytics data saved successfully.");
  return { success: true };
}
