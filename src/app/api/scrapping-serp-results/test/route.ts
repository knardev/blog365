import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSerpResults } from "./actions"; // 실제 모듈 경로로 변경

export async function POST(_request: Request) {
  const data = await _request.json();
  const keyword = data.keyword;

  console.log(`[REQUEST] Received keyword: ${keyword}`);

  try {
    const serpData = await fetchSerpResults(keyword);

    if (!serpData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch SERP results",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, data: serpData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch SERP results:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch SERP results" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
