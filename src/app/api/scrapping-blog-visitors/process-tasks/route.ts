import { createClient } from "@supabase/supabase-js";
import { processBlogVisitorData } from "./actions";

export const runtime = "edge"; // Next.js Edge Runtime

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE ?? "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE are required.");
}

// Initialize clients
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

const MESSAGE_LIMIT = 50;

export async function GET(request: Request) {
  // 간단한 인증 로직 (원한다면): 헤더 검사
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  const incomingKey = request.headers.get("X-Secret-Key");
  if (!envServiceRole || incomingKey !== envServiceRole) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(
    `[ROUTE] Fetching up to ${MESSAGE_LIMIT} messages from the queue...`,
  );

  const { data: messages, error: queueError } = await queues.rpc("read", {
    queue_name: "blog_scrapping",
    sleep_seconds: 0,
    n: MESSAGE_LIMIT,
  });

  if (queueError) {
    console.error("[ERROR] Failed to fetch messages from queue:", queueError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch messages" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!messages || messages.length === 0) {
    console.warn("[WARN] No messages found in the queue.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "No messages found in the queue.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log(`[INFO] Retrieved ${messages.length} messages from the queue.`);

  for (const message of messages) {
    const blog_slug = message.message.blog_slug;
    console.log(`[INFO] Processing message with blog_slug "${blog_slug}"...`);

    const result = await processBlogVisitorData(supabase, blog_slug);

    if (!result.success) {
      console.error(
        `[ERROR] Failed to process message with blog_slug "${blog_slug}": ${result.error}`,
      );
      // 메시지 처리 실패했지만, 계속 진행(또는 로직에 따라 중단 가능)
      continue;
    }

    console.log(
      `[SUCCESS] Message with blog_slug "${blog_slug}" processed successfully.`,
    );

    // 메시지를 성공적으로 처리한 뒤 아카이브
    const { error: archiveError } = await queues.rpc("archive", {
      queue_name: "blog_scrapping",
      message_id: message.msg_id,
    });

    if (archiveError) {
      console.error(
        `[ERROR] Failed to archive message with id "${message.msg_id}":`,
        archiveError,
      );
    } else {
      console.log(
        `[INFO] Message with id "${message.msg_id}" archived from the queue.`,
      );
    }
  }

  console.log("[ROUTE] Process Queue Messages completed.");
  return new Response(
    JSON.stringify({
      success: true,
      message: "Process Queue Messages completed.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
