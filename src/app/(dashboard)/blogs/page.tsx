import { Suspense } from "react";
import { redirect } from "next/navigation";
// components
import { BlogTableHeader } from "@/features/blogs/components/blog-header";
import { BlogDataTableLoader } from "@/features/blogs/components/blog-data-table-loader";
import { TablePanelFallback } from "@/features/blogs/components/table-panel-fallback";
// actions
import { getProfileData } from "@/features/common/actions/get-profile";
// types
import { LoggedInUser } from "@/features/common/types/types";

export default async function Page() {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  // Pass raw data and allDates to the client component
  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <BlogTableHeader profileId={loggedInUser?.profile.id} />
      <Suspense fallback={<TablePanelFallback />}>
        <BlogDataTableLoader profileId={loggedInUser?.profile.id} />
      </Suspense>
    </div>
  );
}
