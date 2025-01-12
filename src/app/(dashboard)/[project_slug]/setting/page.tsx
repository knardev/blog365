import { redirect } from "next/navigation";
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchMessageTargets } from "@/features/setting/actions/fetch-message-target";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
import { LoggedInUser } from "@/features/common/types/types";
import { MessageTargetsCards } from "@/features/setting/components/message-target-card";
import { KeywordCategoriesCards } from "@/features/setting/components/keyword-category-card";
import { AddMessageTargetInput } from "@/features/setting/components/add-message-target-input";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          className="p-4 flex flex-col space-y-4"
          defaultSize={50}
        >
          <h4 className="text-lg font-semibold">
            매일 분석레포트를 받을 전화번호를 설정해주세요.
          </h4>
          <Button asChild variant="destructive" size="default">
            <a href="http://pf.kakao.com/_DxkVnG/chat" target="_blank">
              카톡채널 친구 추가 (필수)
            </a>
          </Button>
          <AddMessageTargetInput projectSlug={params.project_slug} />
          <div className="flex-1 overflow-y-auto">
            <MessageTargetsCards
              messageTargets={messageTargets ?? []}
              projectSlug={params.project_slug}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle disabled />
        <ResizablePanel
          className="p-4 flex flex-col space-y-4"
          defaultSize={50}
        >
          <h4 className="text-lg font-semibold">
            키워드 카테고리를 설정해주세요.
          </h4>
          <AddKeywordCategoryInput projectSlug={params.project_slug} />
          <div className="flex-1 overflow-y-auto">
            <KeywordCategoriesCards
              key={params.project_slug}
              initialCategories={keywordCategories ?? []}
              projectSlug={params.project_slug}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
