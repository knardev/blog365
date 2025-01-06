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
      }. Processing in parallel...`,
    );

    // 2) 병렬로 각 트래커 처리
    const messagesPerPage = await Promise.all(
      trackers.map((tracker) => processTracker(tracker)),
    );

    // 메시지를 모두 모으기 (각 트래커에 대해 여러 메시지가 생성될 수 있음)
    const flattenedMessages = messagesPerPage.flat();

    if (flattenedMessages.length === 0) {
      console.warn(`[WARN] No messages to enqueue for page ${page + 1}.`);
      continue;
    }

    totalMessages += flattenedMessages.length;

    console.log(
      `[INFO] Sending ${flattenedMessages.length} messages to the queue...`,
    );

    // 3) 큐에 메시지 추가
    const { error: queueError } = await queues.rpc("send_batch", {
      queue_name: "blog_ranks_scrapping",
      messages: flattenedMessages,
      sleep_seconds: 0,
    });

    if (queueError) {
      console.error(
        `[ERROR] Failed to enqueue messages for page ${page + 1}:`,
        queueError.message,
      );
    } else {
      console.log(
        `[SUCCESS] Successfully added ${flattenedMessages.length} tasks to the queue for page ${
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

/**
 * 각 트래커에 대해 블로그를 가져오고 메시지를 생성하는 함수
 * @param tracker - 개별 트래커 객체
 * @returns 메시지 객체 배열
 */
async function processTracker(tracker: {
  id: string;
  keyword_id: string;
  project_id: string;
}): Promise<
  {
    tracker_id: string;
    keyword_id: string;
    project_id: string;
    blog_id: string;
  }[]
> {
  if (!tracker.project_id) {
    console.warn(`[WARN] Tracker ${tracker.id} has no project_id. Skipping...`);
    return [];
  }

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
    return [];
  }

  if (!blogs || blogs.length === 0) {
    console.warn(
      `[WARN] No active blogs found for project ${tracker.project_id}.`,
    );
    return [];
  }

  console.log(
    `[INFO] Found ${blogs.length} active blogs for project ${tracker.project_id}.`,
  );

  // 모든 블로그에 대해 메시지를 생성
  return blogs.map((blog) => ({
    tracker_id: tracker.id,
    keyword_id: tracker.keyword_id,
    project_id: tracker.project_id,
    blog_id: blog.blog_id,
  }));
}
