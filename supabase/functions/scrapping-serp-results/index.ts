import { createClient } from "@supabase"; // Deno-compatible supabase client

/**
 * Delay function that returns a Promise resolved after `ms` milliseconds.
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * We'll allow up to `CONCURRENCY_LIMIT` requests in flight at once.
 * You can tweak this value to fit your needs.
 */
const CONCURRENCY_LIMIT = 20;
const PAGE_SIZE = 1000; // We fetch up to 1000 items per page from Supabase

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

    // 3) Background task with pagination + concurrency
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log(
            "[INFO] Starting concurrency-limited + paginated task...",
          );

          // Step A: Count total rows in "keywords"
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

          console.log(`[INFO] Found ${count} keywords total.`);

          // Base URL for making fetch calls
          const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
          if (!baseUrl) {
            console.error("[ERROR] NEXT_BASE_URL not configured.");
            return;
          }

          // Step B: Calculate total pages
          const totalPages = Math.ceil(count / PAGE_SIZE);
          console.log(`[INFO] There will be ${totalPages} pages to process.`);

          // Step C: Process each page in sequence
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const start = pageIndex * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            console.log(
              `[INFO] Fetching page ${
                pageIndex + 1
              }/${totalPages}, range=[${start}, ${end}]`,
            );

            // Fetch up to 1000 keywords for this page
            const { data: keywords, error: pageError } = await supabase
              .from("keywords")
              .select("id, name")
              .range(start, end);

            if (pageError) {
              console.error("[ERROR] Failed to fetch page:", pageError.message);
              continue; // skip this page if error
            }

            if (!keywords || keywords.length === 0) {
              console.log(
                `[INFO] Page ${pageIndex + 1} has no keywords. Skipping...`,
              );
              continue;
            }

            console.log(
              `[INFO] Page ${pageIndex + 1} contains ${keywords.length} items.`,
            );

            // Step D: Concurrency-limited processing for this page's keywords
            await processItemsWithConcurrencyLimit(
              keywords,
              baseUrl,
              envServiceRole,
            );

            console.log(
              `[INFO] Finished processing page ${
                pageIndex + 1
              } of ${totalPages}.`,
            );
          }

          console.log("[INFO] All pages processed successfully.");
        } catch (err) {
          console.error("[ERROR] Exception in concurrency-limited task:", err);
        }
      })(),
    );

    // Return an immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          `Started concurrency-limited + paginated process with limit=${CONCURRENCY_LIMIT}.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start task:", err);
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

/**
 * processItemsWithConcurrencyLimit
 *
 * Runs up to CONCURRENCY_LIMIT parallel requests for the provided items.
 * Once done, resolves. If one request is slow, it won't block the rest
 * from starting as long as a slot is available.
 */
async function processItemsWithConcurrencyLimit(
  items: { id: string; name: string }[],
  baseUrl: string,
  envServiceRole: string,
) {
  let currentIndex = 0;
  let inFlight = 0;
  const total = items.length;

  while (currentIndex < total || inFlight > 0) {
    // 1) If we have capacity and items left, launch new requests
    while (inFlight < CONCURRENCY_LIMIT && currentIndex < total) {
      const { id, name } = items[currentIndex++];
      inFlight++;
      console.log(
        `[DEBUG] inFlight increased to ${inFlight}. (Launching "${name}")`,
      );

      fetch(`${baseUrl}/api/scrapping-serp-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": envServiceRole,
        },
        body: JSON.stringify({
          keyword_id: id,
          keyword_name: name,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            console.error(
              `[ERROR] SERP request failed for keyword "${name}":`,
              await res.text(),
            );
          } else {
            console.log(
              `[SUCCESS] SERP request succeeded for keyword "${name}".`,
            );
          }
        })
        .catch((err) => {
          console.error(
            `[ERROR] SERP request error for keyword "${name}":`,
            err,
          );
        })
        .finally(() => {
          inFlight--;
          console.log(
            `[DEBUG] inFlight decreased to ${inFlight}. (Finished "${name}")`,
          );
        });
    }

    // 2) If we still have items not started, or requests in flight, wait a bit
    if (currentIndex < total || inFlight > 0) {
      // Wait 1 second to let some requests finish
      await delay(500);
    }
  }
}
