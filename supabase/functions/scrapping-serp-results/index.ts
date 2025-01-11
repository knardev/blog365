import { createClient } from "@supabase"; // Deno-compatible supabase client

/**
 * A small helper to split an array into chunks of a specified size.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

Deno.serve((req: Request) => {
  try {
    // 1) Authentication logic
    const envServiceRole = Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const incomingKey = req.headers.get("X-Secret-Key") ?? "";
    if (!envServiceRole || incomingKey !== envServiceRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2) Supabase Client initialization
    const supabaseUrl = Deno.env.get("EDGE_SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "EDGE_SUPABASE_URL and EDGE_SUPABASE_SERVICE_ROLE_KEY are required.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "public" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // 3) Background task starts here
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log("[INFO] Starting SERP scrapping background task...");

          // Step A: Count the total number of keywords
          const PAGE_SIZE = 1000;
          const { count, error: countError } = await supabase
            .from("keywords")
            .select("*", { count: "exact", head: true });

          if (countError) {
            console.error("[ERROR] Failed to count keywords:", countError);
            return;
          }

          if (!count || count === 0) {
            console.warn("[WARN] No keywords found in the database.");
            return;
          }

          console.log(`[INFO] Found total ${count} keywords.`);

          const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
          if (!baseUrl) {
            console.error("[ERROR] NEXT_BASE_URL not configured.");
            return;
          }

          // Step B: Calculate total pages
          const totalPages = Math.ceil(count / PAGE_SIZE);

          // Step C: Loop over pages
          for (let page = 0; page < totalPages; page++) {
            const start = page * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            console.log(
              `[INFO] Fetching keywords for page ${
                page + 1
              }/${totalPages}, range=[${start},${end}]`,
            );

            // Step D: Fetch keywords for the current page
            const { data: keywords, error: keywordsError } = await supabase
              .from("keywords")
              .select("id, name")
              .range(start, end);

            if (keywordsError) {
              console.error(
                `[ERROR] Failed to fetch keywords in page ${page + 1}:`,
                keywordsError.message,
              );
              // Decide whether to continue or break out
              continue;
            }

            if (!keywords || keywords.length === 0) {
              console.log(
                `[INFO] Page ${page + 1} has no keywords. Skipping...`,
              );
              continue;
            }

            console.log(
              `[INFO] Fetched ${keywords.length} keywords on this page.`,
            );

            // Step E: Split the ~1,000 keywords from this page into smaller chunks of 10
            const chunkedKeywords = chunkArray(keywords, 100);

            // For each chunk of 10, make parallel requests, then move to the next chunk
            for (const [index, chunk] of chunkedKeywords.entries()) {
              console.log(
                `[INFO] Sending requests for chunk #${
                  index + 1
                }, size=${chunk.length}.`,
              );

              const tasks = chunk.map((keyword) =>
                fetch(`${baseUrl}/api/scrapping-serp-results`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Secret-Key": envServiceRole,
                  },
                  body: JSON.stringify({
                    keyword_id: keyword.id,
                    keyword_name: keyword.name,
                  }),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      console.error(
                        `[ERROR] SERP request failed for keyword "${keyword.name}":`,
                        await res.text(),
                      );
                    } else {
                      console.log(
                        `[SUCCESS] SERP request succeeded for keyword "${keyword.name}".`,
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(
                      `[ERROR] SERP request error for keyword "${keyword.name}":`,
                      err,
                    );
                  })
              );

              // Wait for the current 10-keyword chunk to finish before starting next chunk
              await Promise.all(tasks);
            }

            console.log(
              `[INFO] Finished processing page ${page + 1} of ${totalPages}.`,
            );
          }

          console.log(
            "[INFO] All pages processed successfully. SERP scrapping completed.",
          );
        } catch (err) {
          console.error(
            "[ERROR] Exception occurred during SERP scrapping task:",
            err,
          );
        }
      })(),
    );

    // 4) Immediate response to the client
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Background SERP scrapping task started. Check logs for progress.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start SERP scrapping task:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
