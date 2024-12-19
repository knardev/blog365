"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "../ui/sidebar";

export function NavHeaderWithTrigger() {
  const pathname = usePathname();
  const header =
    pathname === "/blogs"
      ? "내 블로그"
      : pathname.includes("/tracker")
      ? "상위노출 추적"
      : pathname.includes("/keyword")
      ? "키워드 관리"
      : pathname.includes("/kakao")
      ? "카카오 알림"
      : pathname.includes("/member")
      ? "멤버 관리"
      : "";

  return (
    <div className="w-full flex items-center gap-4 mb-5">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">{header}</h1>
    </div>
  );
}
