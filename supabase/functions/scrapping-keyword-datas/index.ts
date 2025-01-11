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

/**
 * A tiny delay function that returns a Promise resolved after `ms` milliseconds.
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
          console.log("[INFO] Starting keyword scrapping background task...");

          // A) Count total keywords in the database
          const PAGE_SIZE = 1000;
          const CHUNK_SIZE = 3;

          const { count, error: countError } = await supabase
            .from("keywords")
            .select("*", { head: true, count: "exact" });

          if (countError) {
            console.error("[ERROR] Failed to count keywords:", countError);
            return;
          }

          if (!count || count === 0) {
            console.warn("[WARN] No keywords found in the database.");
            return;
          }

          console.log(`[INFO] Found a total of ${count} keywords.`);

          // B) Calculate total pages
          const totalPages = Math.ceil(count / PAGE_SIZE);
          console.log(
            `[INFO] Splitting into ${totalPages} pages (max 1000 each).`,
          );

          const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
          if (!baseUrl) {
            console.error("[ERROR] NEXT_BASE_URL not configured.");
            return;
          }

          // C) Process pages sequentially
          for (let page = 0; page < totalPages; page++) {
            const start = page * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            console.log(
              `[INFO] Fetching keywords for page ${
                page + 1
              }/${totalPages}, range=[${start}, ${end}]`,
            );

            // D) Fetch keywords in the current page
            const { data: keywords, error: keywordsError } = await supabase
              .from("keywords")
              .select("id, name")
              .range(start, end);

            if (keywordsError) {
              console.error(
                `[ERROR] Failed to fetch keywords on page ${page + 1}:`,
                keywordsError.message,
              );
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

            // E) Within each page, chunk into smaller groups of CHUNK_SIZE
            const chunkedKeywords = chunkArray(keywords, CHUNK_SIZE);

            // F) Process each chunk sequentially
            for (const [idx, chunk] of chunkedKeywords.entries()) {
              console.log(
                `[INFO] Processing chunk #${
                  idx + 1
                } with ${chunk.length} keywords...`,
              );

              // G) In each chunk, do parallel fetches
              const tasks = chunk.map((keyword) =>
                fetch(`${baseUrl}/api/scrapping-keyword-datas`, {
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
                        `[ERROR] keyword "${keyword.name}" request failed:`,
                        await res.text(),
                      );
                    } else {
                      console.log(
                        `[SUCCESS] keyword "${keyword.name}" request succeeded.`,
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(
                      `[ERROR] keyword "${keyword.name}" fetch error:`,
                      err,
                    );
                  })
              );

              // H) Wait for the entire chunk's parallel tasks to complete
              await Promise.all(tasks);

              console.log(`[INFO] Chunk #${idx + 1} done. ✔️`);

              // I) 1-second delay to avoid hitting rate limits
              await delay(1000);
            }

            console.log(
              `[INFO] Finished processing page ${page + 1}/${totalPages}.`,
            );
          }

          console.log(
            "[INFO] All pages processed successfully. Keyword scrapping completed.",
          );
        } catch (err) {
          console.error(
            "[ERROR] Exception occurred during keyword scrapping:",
            err,
          );
        }
      })(),
    );

    // J) Return an immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Background keyword scrapping task started. Check logs for details.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start keyword scrapping:", err);
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
