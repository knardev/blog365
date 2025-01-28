// utils
import { redirect } from "next/navigation";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
// components
import { KeywordTrackerTemplate } from "@/features/tracker/components/keyword-tracker-template";
// actions
import { getProfileData } from "@/features/common/actions/get-profile";
// types
import { LoggedInUser } from "@/features/common/types/types";

export const revalidate = 3600;
export const maxDuration = 60;

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    project_slug: string;
  };
  searchParams: {
    mode?: string;
  };
}) {
  const loggedInUser: LoggedInUser | null = await getProfileData();
  if (!loggedInUser) {
    redirect("/login");
  }

  // 예: 지난 30일치 날짜를 미리 생성
  const KST = "Asia/Seoul";
  const now = new Date();
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, index);
    return formatInTimeZone(date, KST, "yyyy-MM-dd");
  });

  return (
    <KeywordTrackerTemplate
      projectSlug={params.project_slug}
      profileId={loggedInUser.profile.id}
      allDates={allDates}
    />
  );
}
