import { redirect } from "next/navigation";
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchMessageTargets } from "@/features/setting/actions/fetch-message-target";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { LoggedInUser } from "@/features/common/types/types";
import { MessageTargetsCards } from "@/features/setting/components/message-target-card";
import { KeywordCategoriesCards } from "@/features/setting/components/keyword-category-card";
import { AddMessageTargetInput } from "@/features/setting/components/add-message-target-input";
import { Button } from "@/components/ui/button";
import { AddKeywordCategoryInput } from "@/features/setting/components/add-keyword-category-input";

export default async function Page({
  params,
}: Readonly<{
  params: {
    project_slug: string;
  };
}>) {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  // Fetch message targets and keyword categories
  const [messageTargets, keywordCategories] = await Promise.all([
    fetchMessageTargets(params.project_slug),
    fetchKeywordCategories(params.project_slug),
  ]);

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-6 p-2">
        <div className="flex gap-4 items-center">
          <h4 className="text-lg font-semibold">
            매일 분석레포트를 받을 전화번호를 설정해주세요.
          </h4>
          <Button asChild variant="outline" size="sm">
            <a href="http://pf.kakao.com/_DxkVnG/chat" target="_blank">
              친구 추가 필수
            </a>
          </Button>
        </div>
        <AddMessageTargetInput projectSlug={params.project_slug} />
        <MessageTargetsCards
          messageTargets={messageTargets ?? []}
          projectSlug={params.project_slug}
        />
        <h4 className="text-lg font-semibold">
          키워드 카테고리를 설정해주세요.
        </h4>
        <AddKeywordCategoryInput projectSlug={params.project_slug} />
        <KeywordCategoriesCards
          keywordCategories={keywordCategories ?? []}
          projectSlug={params.project_slug}
        />
      </div>
    </div>
  );
}
