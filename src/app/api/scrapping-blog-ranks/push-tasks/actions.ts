import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize Supabase clients
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

const PAGE_SIZE = 1000; // 한 페이지에 가져올 트래커 수

export async function pushKeywordTrackerTasks() {
  console.log("[ACTION] Fetching total count of active keyword trackers...");

  // 1) 키워드 트래커 총 개수 가져오기
  const { count, error: countError } = await supabase
    .from("keyword_trackers")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (countError) {
    console.error(
      "[ERROR] Failed to fetch keyword tracker count:",
      countError.message,
    );
    return { success: false, error: countError.message };
  }

  if (!count || count === 0) {
    console.warn("[WARN] No active keyword trackers found.");
    return { success: false, error: "No active keyword trackers found." };
  }

  console.log(
    `[INFO] Found ${count} active keyword trackers. Preparing to fetch in pages...`,
  );

  // 2) 페이지 단위로 키워드 트래커 가져오기
  let totalMessages: number = 0;
  const totalPages = Math.ceil(count / PAGE_SIZE); // 전체 페이지 수 계산

  for (let page = 0; page < totalPages; page++) {
    console.log(`[INFO] Fetching page ${page + 1} of ${totalPages}...`);

    // 각 페이지별 키워드 트래커 가져오기
    const { data: trackers, error: trackersError } = await supabase
      .from("keyword_trackers")
      .select("id, keyword_id, project_id")
      .eq("active", true)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (trackersError) {
      console.error(
        `[ERROR] Failed to fetch keyword trackers for page ${page + 1}:`,
        trackersError.message,
      );
      continue; // 에러 발생 시 해당 페이지 건너뜀
    }

    if (!trackers || trackers.length === 0) {
      console.warn(`[WARN] No keyword trackers found for page ${page + 1}.`);
      continue;
    }

    console.log(
      `[INFO] Fetched ${trackers.length} keyword trackers for page ${
        page + 1
      }.`,
    );

    // 3) 각 트래커에 대해 관련 블로그 가져오기 및 메시지 생성
    const messages: {
      tracker_id: string;
      keyword_id: string;
      project_id: string;
      blog_id: string;
    }[] = [];

    for (const tracker of trackers) {
      if (!tracker.project_id) continue;

      const { data: blogs, error: blogsError } = await supabase
        .from("projects_blogs")
        .select("blog_id")
        .eq("project_id", tracker.project_id)
        .eq("active", true);

      if (blogsError) {
        console.error(
          `[ERROR] Failed to fetch blogs for project ${tracker.project_id}:`,
          blogsError.message,
        );
        continue;
      }

      if (!blogs || blogs.length === 0) {
        console.warn(
          `[WARN] No active blogs found for project ${tracker.project_id}.`,
        );
        continue;
      }

      console.log(
        `[INFO] Found ${blogs.length} active blogs for project ${tracker.project_id}.`,
      );

      // 메시지 생성
      for (const blog of blogs) {
        if (!blog.blog_id) continue;

        messages.push({
          tracker_id: tracker.id,
          keyword_id: tracker.keyword_id,
          project_id: tracker.project_id,
          blog_id: blog.blog_id,
        });
      }
    }

    if (messages.length === 0) {
      console.warn(`[WARN] No messages to enqueue for page ${page + 1}.`);
      continue;
    }

    totalMessages += messages.length;

    console.log(`[INFO] Sending ${messages.length} messages to the queue...`);

    // 4) 큐에 메시지 추가
    const { error: queueError } = await queues.rpc("send_batch", {
      queue_name: "blog_ranks_scrapping",
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
