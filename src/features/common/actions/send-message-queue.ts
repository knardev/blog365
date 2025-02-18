"use server";

import { createClient } from "@supabase/supabase-js";

export const sendMessageQueue = async ({
  queueName,
  messages,
}: {
  queueName: string;
  messages: Record<string, string>[];
}): Promise<{ success: boolean; count: number }> => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE ?? "";
  const queues = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      db: { schema: "pgmq_public" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { error } = await queues.rpc("send_batch", {
    queue_name: queueName,
    messages,
    sleep_seconds: 5,
  });

  if (error) {
    console.error("Error sending message to queue:", error);
    throw new Error("Failed to send message to queue");
  }

  return { success: true, count: messages.length };
};
