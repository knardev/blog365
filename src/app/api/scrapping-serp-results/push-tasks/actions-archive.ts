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

const PAGE_SIZE = 1000;

export async function pushSerpScrapingTasks() {
  console.log("[ACTION] Fetching keywords from the `keywords` table...");

  // 1) 현재 keywords 테이블에 몇 개 있는지 (head: true + count: 'exact')
  //    - head: true 로 실제 데이터는 안 가져오고, count만 구함
  const { count, error: countError } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[ERROR] Failed to count keywords:", countError.message);
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No keywords found in the `keywords` table.");
    return { success: false, error: "No keywords found in the database." };
  }

  console.log(`[INFO] Found total ${count} keywords.`);

  let totalPushed = 0; // 전체 메시지 push 개수

  // 2) 페이지네이션: PAGE_SIZE씩 끊어서 가져오기
  const totalPages = Math.ceil(count / PAGE_SIZE);

  for (let page = 0; page < totalPages; page++) {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(
      `[INFO] Fetching keywords: page=${
        page + 1
      }/${totalPages}, range=[${start},${end}]`,
    );

    // 3) 이 페이지 키워드 목록 가져오기
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, name")
      .range(start, end); // start ~ end(포함)

    if (keywordsError) {
      console.error(
        `[ERROR] Failed to fetch keywords in page ${page + 1}:`,
        keywordsError.message,
      );
      // 페이지 단위 에러 -> 계속 진행할지, 중단할지는 상황에 맞춰 결정
      continue;
    }

    if (!keywords || keywords.length === 0) {
      console.log(`[INFO] No keywords on page ${page + 1}. Skipping...`);
      continue;
    }

    // 4) 큐에 전송할 메시지 준비
    const messages = keywords.map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    }));

    console.log(
      `[INFO] Sending ${messages.length} messages to the queue: serp_scrapping`,
    );

    // 5) 큐에 send_batch
    const { error: queueError } = await queues.rpc("send_batch", {
      queue_name: "serp_scrapping",
      messages: messages,
      sleep_seconds: 0,
    });

    if (queueError) {
      console.error("[ERROR] Failed to enqueue messages:", queueError.message);
      // 마찬가지로 페이지 단위 에러 -> 계속 진행 or 중단은 판단에 따라
      continue;
    }

    totalPushed += messages.length;
    console.log(`[SUCCESS] Added ${messages.length} tasks (page ${page + 1}).`);
  }

  console.log(`[RESULT] Total ${totalPushed} tasks added to the queue.`);
  return { success: true, count: totalPushed };
}
