export async function scrapSingleTrackerResult({
  projectId,
  trackerId,
  keywordId,
  keywordName,
}: {
  projectId: string;
  trackerId: string;
  keywordId: string;
  keywordName: string;
}): Promise<boolean> {
  let response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/scrapping-keyword-datas`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": process.env.SUPABASE_SERVICE_ROLE ?? "",
      },
      body: JSON.stringify({
        keyword_id: keywordId,
        keyword_name: keywordName,
      }),
    },
  );

  let data = await response.json();
  if (!data.success) {
    console.error(
      `Failed to scrap keyword tracker result for project ${projectId}, tracker ${trackerId}, keyword ${keywordId}`,
    );
    return false;
  }

  response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/scrapping-serp-results`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": process.env.SUPABASE_SERVICE_ROLE ?? "",
      },
      body: JSON.stringify({
        keyword_id: keywordId,
        keyword_name: keywordName,
      }),
    },
  );
  data = await response.json();
  if (!data.success) {
    console.error(
      `Failed to scrap SERP result for project ${projectId}, tracker ${trackerId}, keyword ${keywordId}`,
    );
    return false;
  }

  response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/scrapping-blog-ranks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": process.env.SUPABASE_SERVICE_ROLE ?? "",
      },
      body: JSON.stringify({
        tracker_id: trackerId,
        keyword_id: keywordId,
        project_id: projectId,
      }),
    },
  );
  data = await response.json();
  if (!data.success) {
    console.error(
      `Failed to scrap blog rank for project ${projectId}, tracker ${trackerId}, keyword ${keywordId}`,
    );
    return false;
  }

  console.log(
    `Scrap keyword tracker result for project ${projectId}, tracker ${trackerId}, keyword ${keywordId}`,
  );
  return true;
}
