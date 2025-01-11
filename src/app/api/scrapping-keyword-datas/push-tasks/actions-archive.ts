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

const queues = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "pgmq_public" },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const PAGE_SIZE = 1000; // 한 페이지에 가져올 키워드 수

export async function pushKeywordScrapingTasks() {
  console.log("[ACTION] Fetching total keyword count...");

  // 1) 키워드 총 개수 가져오기
  const { count, error: countError } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[ERROR] Failed to fetch keyword count:", countError.message);
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No keywords found in the `keywords` table.");
    return { success: false, error: "No keywords found in the database." };
  }

  console.log(`[INFO] Found ${count} keywords. Preparing to fetch in pages...`);

  // 2) 페이지 단위로 키워드 가져오기
  let totalMessages: number = 0;
  const totalPages = Math.ceil(count / PAGE_SIZE); // 전체 페이지 수 계산

  for (let page = 0; page < totalPages; page++) {
    console.log(`[INFO] Fetching page ${page + 1} of ${totalPages}...`);

    // 각 페이지별 키워드 가져오기
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, name")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (keywordsError) {
      console.error(
        `[ERROR] Failed to fetch keywords for page ${page + 1}:`,
        keywordsError.message,
      );
      continue; // 에러가 발생한 경우 해당 페이지 건너뜀
    }

    if (!keywords || keywords.length === 0) {
      console.warn(`[WARN] No keywords found for page ${page + 1}.`);
      continue;
    }

    console.log(
      `[INFO] Fetched ${keywords.length} keywords for page ${page + 1}.`,
    );

    // 3) 메시지 생성
    const messages = keywords.map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    totalMessages += messages.length;

    console.log(`[INFO] Sending ${messages.length} messages to the queue...`);

    // 4) 큐에 메시지 추가
    const { error: queueError } = await queues.rpc("send_batch", {
      queue_name: "keyword_data_scrapping",
      messages: messages,
      sleep_seconds: 0,
    });

    if (queueError) {
      console.error(
        `[ERROR] Failed to enqueue messages for page ${page + 1}:`,
        queueError.message,
      );
    } else {
      console.log(
        `[SUCCESS] Successfully added ${messages.length} tasks to the queue for page ${
          page + 1
        }.`,
      );
    }
  }

  console.log(
    `[INFO] All pages processed. Total messages sent: ${totalMessages}.`,
  );

  return { success: true, count: totalMessages };
}
