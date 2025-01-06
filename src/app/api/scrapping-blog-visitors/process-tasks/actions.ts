import { SupabaseClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

type VisitorCntNode = {
  "@_id": string;
  "@_cnt": string;
};

type ParsedXml = {
  visitorcnts?: {
    visitorcnt?: VisitorCntNode[];
  };
};

type VisitorData = {
  blog_id: string;
  date: string;
  daily_visitor: number;
};

// 메시지 내의 message 필드 타입
export interface MessageContent {
  id: string;
  blog_slug: string;
}

// 큐 메시지 타입
export interface QueueMessage {
  msg_id: number;
  read_ct: number;
  enqueued_at: string; // ISO 8601 datetime string
  vt: string; // ISO 8601 datetime string
  message: MessageContent;
}

export async function processBlogVisitorData(
  supabaseClient: SupabaseClient,
  id: string,
  blogSlug: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log("[INFO] Fetching blog_id for given blog_slug");
    const { data: blogData, error: blogError } = await supabaseClient
      .from("blogs")
      .select("id, is_influencer")
      .eq("id", id)
      .single();

    if (blogError || !blogData) {
      console.error("[ERROR] Failed to fetch blog_id:", blogError);
      return { success: false, error: "Blog not found" };
    }

    if (blogData.is_influencer) {
      console.log("[INFO] Skipping influencer blog");
      return { success: true, message: "Influencer blog" };
    }

    const blogId = blogData.id;
    console.log(`[INFO] Found blog_id: ${blogId}`);

    // Fetch XML data
    const xmlUrl = `https://blog.naver.com/NVisitorgp4Ajax.naver?blogId=${
      encodeURIComponent(blogSlug)
    }`;
    console.log(`[INFO] Fetching XML data from: ${xmlUrl}`);
    const xmlRes = await fetch(xmlUrl);
    if (!xmlRes.ok) {
      console.error("[ERROR] Failed to fetch XML:", xmlRes.statusText);
      return { success: false, error: "Failed to fetch XML data" };
    }

    const xmlText = await xmlRes.text();
    console.log("[INFO] Successfully fetched XML data");

    // Parse XML using fast-xml-parser
    console.log("[INFO] Parsing XML");
    const parser = new XMLParser({
      ignoreAttributes: false,
    });
    const parsedXml = parser.parse(xmlText) as ParsedXml;

    console.log(parsedXml);

    const visitorCntNodes = parsedXml.visitorcnts?.visitorcnt;

    if (!visitorCntNodes || !Array.isArray(visitorCntNodes)) {
      console.warn("[WARN] No visitorcnt nodes found");
      return { success: true, message: "No visitor data found" };
    }

    // 가장 마지막 데이터(가장 최신)는 제외하고 저장
    // 예: visitorCntNodes가 5개 이상이라고 가정하면, 마지막 하나를 제외하고 4개만 삽입 대상
    const nodesToInsert = visitorCntNodes.slice(0, -1);

    const insertData: VisitorData[] = [];

    for (const node of nodesToInsert) {
      const id = node["@_id"];
      const cnt = node["@_cnt"];

      if (!id || !cnt) {
        console.warn("[WARN] Missing id or cnt attribute in node");
        continue;
      }

      const year = id.slice(0, 4);
      const month = id.slice(4, 6);
      const day = id.slice(6, 8);
      const formattedDate = `${year}-${month}-${day}`;

      const dailyVisitor = parseInt(cnt, 10);
      if (isNaN(dailyVisitor)) {
        console.warn(`[WARN] daily_visitor is not a number: ${cnt}`);
        continue;
      }

      console.log(
        `[INFO] Checking if data for ${formattedDate} already exists`,
      );
      const { data: existing, error: existError } = await supabaseClient
        .from("blog_analytics")
        .select("id")
        .eq("blog_id", blogId)
        .eq("date", formattedDate);

      if (existError) {
        console.error("[ERROR] Error checking existing data:", existError);
        continue;
      }

      if (!existing || existing.length === 0) {
        console.log(
          `[INFO] No existing record for ${formattedDate}, preparing to insert`,
        );
        insertData.push({
          blog_id: blogId,
          date: formattedDate,
          daily_visitor: dailyVisitor,
        });
      } else {
        console.log(
          `[INFO] Record already exists for ${formattedDate}, skipping`,
        );
      }
    }

    // Bulk insert new records
    if (insertData.length > 0) {
      console.log("[INFO] Inserting new records:", insertData);
      const { error: insertError } = await supabaseClient
        .from("blog_analytics")
        .insert(insertData);

      if (insertError) {
        console.error("[ERROR] Insert error:", insertError);
        return { success: false, error: "Insert failed" };
      }

      console.log("[INFO] Insert successful");
    } else {
      console.log("[INFO] No new data to insert");
    }

    console.log("[END] Data processed successfully");
    return { success: true, message: "Data processed successfully" };
  } catch (error) {
    console.error("[ERROR] Exception occurred:", error);
    return { success: false, error: "Server error" };
  }
}
