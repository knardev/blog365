import { redirect } from "next/navigation";
import { fetchKeywordTrackers } from "@/features/keyword/actions/fetch-keyword-trackers";
import { fetchKeywordCategories } from "@/features/keyword/actions/fetch-keyword-categories";
import { KeywordDataTable } from "@/features/keyword/components/keyword-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";

export default async function Page({
  params,
}: Readonly<{ params: { project_slug: string } }>) {
  const loggedInUser = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  const [fetchedData, keywordCategories] = await Promise.all([
    fetchKeywordTrackers(params.project_slug),
    fetchKeywordCategories(params.project_slug),
  ]);

  if (!fetchedData) {
    return <div>데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <KeywordDataTable
      data={fetchedData}
      keywordCategories={keywordCategories || []}
      projectSlug={params.project_slug}
    />
  );
}
