import { SupabaseClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { ZenRows } from "zenrows";

// Initialize ZenRows client (use environment variable for API key)
const ZENROWS_API_KEY = process.env.ZENROW_API_KEY ?? "";
const zenrowsClient = new ZenRows(ZENROWS_API_KEY);

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

export async function processBlogVisitorData(
  supabaseClient: SupabaseClient,
  id: string,
  blogSlug: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log("[INFO] Fetching blog_id for given blog_slug");
    const { data: blogData, error: blogError } = await supabaseClient
      .from("blogs")
      .select("id, is_influencer, influencer_connected_blog_slug")
      .eq("id", id)
      .single();

    if (blogError || !blogData) {
      console.error("[ERROR] Failed to fetch blog_id:", blogError);
      return { success: false, error: "Blog not found" };
    }

    // if (blogData.is_influencer) {
    //   console.log("[INFO] Skipping influencer blog");
    //   return { success: true, message: "Influencer blog" };
    // }

    const finalBlogSlug = blogData.is_influencer
      ? blogData.influencer_connected_blog_slug
      : blogSlug;
    const blogId = blogData.id;
    console.log(`[INFO] Found blog_id: ${blogId}`);

    // Fetch XML data via ZenRows
    const xmlUrl = `https://blog.naver.com/NVisitorgp4Ajax.naver?blogId=${
      encodeURIComponent(finalBlogSlug)
    }`;
    console.log(`[INFO] Fetching XML data via ZenRows: ${xmlUrl}`);

    const zenrowsResponse = await zenrowsClient.get(xmlUrl);

    if (!zenrowsResponse.ok) {
      console.error(
        "[ERROR] Failed to fetch XML via ZenRows:",
        zenrowsResponse.statusText,
      );
      return { success: false, error: "Failed to fetch XML data" };
    }

    const xmlText = await zenrowsResponse.text();
    console.log("[INFO] Successfully fetched XML data via ZenRows");

    // Parse XML using fast-xml-parser
    console.log("[INFO] Parsing XML");
    const parser = new XMLParser({
      ignoreAttributes: false,
    });
    const parsedXml = parser.parse(xmlText) as ParsedXml;

    const visitorCntNodes = parsedXml.visitorcnts?.visitorcnt;

    if (!visitorCntNodes || !Array.isArray(visitorCntNodes)) {
      console.warn("[WARN] No visitorcnt nodes found");
      return { success: true, message: "No visitor data found" };
    }

    // 가장 마지막 데이터(가장 최신)는 제외하고 저장
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
