import { redirect } from "next/navigation";
import { getProfileData } from "@/features/common/actions/get-profile";
import { fetchMessageTargets } from "@/features/kakao/actions/fetch-message-target";
import { LoggedInUser } from "@/features/common/types/types";
import { MessageTargetsCards } from "@/features/kakao/components/message-target-card";
import { AddMessageTargetInput } from "@/features/kakao/components/add-message-target-input";

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

  // Fetch message targets
  const messageTargets = await fetchMessageTargets(params.project_slug);

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-4 p-2">
        <h4 className="text-lg font-semibold">
          매일 메시지를 받을 전화번호를 설정해주세요.
        </h4>
        <AddMessageTargetInput projectSlug={params.project_slug} />
        <MessageTargetsCards
          messageTargets={messageTargets ?? []}
          projectSlug={params.project_slug}
        />
      </div>
    </div>
  );
}
