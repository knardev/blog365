"use server";

import { createClient } from "@/utils/supabase/server";

export async function scrapBlogAnalytics(
  {
    blogId,
    blogSlug,
  }: {
    blogId: string;
    blogSlug: string;
  },
): Promise<boolean> {
  const supabase = createClient();
  let response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/scrapping-blog-visitors`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": process.env.SUPABASE_SERVICE_ROLE ?? "",
      },
      body: JSON.stringify({
        id: blogId,
        blog_slug: blogSlug,
      }),
    },
  );
  let data = await response.json();
  if (!data.success) {
    console.error(
      `Failed to scrap blog analytics for blog ${blogId}, slug ${blogSlug}`,
    );
    return false;
  }

  console.log(
    `Scrapped blog analytics for blog ${blogId}, slug ${blogSlug}`,
  );
  return true;
}
