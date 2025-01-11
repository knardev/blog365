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
        JSON.stringify({
          success: false,
          error: "Unauthorized request.",
        }),
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

    // Background task: Process pages and chunks sequentially
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log("[INFO] Starting blog scrapping background task...");

          // A) Count total blogs
          const PAGE_SIZE = 1000; // Fetch 1000 blogs per page
          const CHUNK_SIZE = 10; // Process in chunks of 10

          const { count, error: countError } = await supabase
            .from("blogs")
            .select("*", { head: true, count: "exact" });

          if (countError) {
            console.error("[ERROR] Failed to count blogs:", countError);
            return;
          }

          if (!count || count === 0) {
            console.warn("[WARN] No blogs found in the database.");
            return;
          }

          console.log(`[INFO] Found total ${count} blogs.`);

          const totalPages = Math.ceil(count / PAGE_SIZE);
          console.log(
            `[INFO] Splitting into ${totalPages} pages (max 1000 per page).`,
          );

          const baseUrl = Deno.env.get("NEXT_BASE_URL") ?? "";
          if (!baseUrl) {
            console.error("[ERROR] NEXT_BASE_URL not configured.");
            return;
          }

          // B) Process pages sequentially
          for (let page = 0; page < totalPages; page++) {
            const start = page * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            console.log(
              `[INFO] Fetching blogs for page ${
                page + 1
              }/${totalPages}, range=[${start}, ${end}]`,
            );

            // C) Fetch blogs for the current page
            const { data: blogs, error: blogsError } = await supabase
              .from("blogs")
              .select("id, blog_slug")
              .range(start, end);

            if (blogsError) {
              console.error(
                `[ERROR] Failed to fetch blogs in page ${page + 1}:`,
                blogsError.message,
              );
              continue;
            }

            if (!blogs || blogs.length === 0) {
              console.log(`[INFO] Page ${page + 1} has no blogs. Skipping...`);
              continue;
            }

            console.log(`[INFO] Fetched ${blogs.length} blogs on this page.`);

            // D) Split the fetched blogs into chunks of CHUNK_SIZE
            const chunkedBlogs = chunkArray(blogs, CHUNK_SIZE);

            // E) Process each chunk sequentially
            for (const [idx, chunk] of chunkedBlogs.entries()) {
              console.log(
                `[INFO] Processing chunk #${
                  idx + 1
                } with ${chunk.length} blogs...`,
              );

              // F) Process tasks in parallel within each chunk
              const tasks = chunk.map((blog) =>
                fetch(`${baseUrl}/api/scrapping-blog-visitors`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Secret-Key": envServiceRole,
                  },
                  body: JSON.stringify({
                    id: blog.id,
                    blog_slug: blog.blog_slug,
                  }),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      console.error(
                        `[ERROR] blog_slug "${blog.blog_slug}" request failed:`,
                        await res.text(),
                      );
                    } else {
                      console.log(
                        `[SUCCESS] blog_slug "${blog.blog_slug}" request succeeded.`,
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(
                      `[ERROR] blog_slug "${blog.blog_slug}" fetch error:`,
                      err,
                    );
                  })
              );

              // Wait for all tasks in the current chunk to finish
              await Promise.all(tasks);

              console.log(`[INFO] Chunk #${idx + 1} done. ✔️`);
            }

            console.log(
              `[INFO] Finished processing page ${page + 1}/${totalPages}.`,
            );
          }

          console.log(
            "[INFO] All pages processed successfully. Blog scrapping completed.",
          );
        } catch (err) {
          console.error(
            "[ERROR] Exception occurred during background task:",
            err,
          );
        }
      })(),
    );

    // Immediate response to the client
    return new Response(
      JSON.stringify({
        success: true,
        message: "Background task started. Blogs are being processed.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ERROR] Failed to start background task:", err);
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
