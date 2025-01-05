import { redirect } from "next/navigation";
import { fetchBlogsWithAnalytics } from "@/features/blogs/actions/fetch-blogs-with-analytics";
import { BlogsDataTable } from "@/features/blogs/components/blog-data-table";
import { getProfileData } from "@/features/common/actions/get-profile";
import { LoggedInUser } from "@/features/common/types/types";
import { format, subDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { BlogTableHeader } from "@/features/blogs/components/blog-header";

export default async function Page() {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  const fetchedData = await fetchBlogsWithAnalytics(loggedInUser?.profile.id);

  // 현재 UTC 기준 시간을 한국시간으로 변환
  const KST = "Asia/Seoul";
  const now = new Date();

  // 한국시간 기준 어제 날짜 객체 생성
  const yesterdayDate = subDays(now, 1);
  console.log("nowInKST", yesterdayDate);

  // 지난 30일의 날짜를 생성
  const allDates: string[] = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(yesterdayDate, index); // 어제 날짜부터 하나씩 줄어드는 날짜 계산
    // console.log(formatInTimeZone(date, KST, "yyyy-MM-dd"));
    return formatInTimeZone(date, KST, "yyyy-MM-dd"); // 한국시간 기준으로 포맷팅
  });

  // Pass raw data and allDates to the client component
  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <BlogTableHeader profileId={loggedInUser?.profile.id} />
      <BlogsDataTable
        data={fetchedData}
        allDates={allDates}
        profileId={loggedInUser?.profile.id}
      />
    </div>
  );
}
