"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionMarkTooltip } from "@/components/custom-ui/question-tooltip";

export function StrictModeSwitch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // 현재 URL 쿼리에 mode=strict가 있는지 체크
  const isStrictMode = searchParams.get("mode") === "strict";

  // 스위치가 토글될 때 호출
  const handleStrictModeToggle = (checked: boolean) => {
    setIsLoading(true);

    const params = new URLSearchParams(searchParams.toString());

    if (checked) {
      params.set("mode", "strict");
    } else {
      params.delete("mode");
    }

    const nextUrl = `${pathname}?${params.toString()}`;

    router.push(nextUrl);

    // 로딩 상태를 약간의 딜레이 후 해제
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="strictMode"
        checked={isStrictMode}
        onCheckedChange={handleStrictModeToggle}
        disabled={isLoading} // 로딩 중에는 비활성화
      />
      <Label htmlFor="strictMode">엄격 모드</Label>
      <QuestionMarkTooltip content="엄격 모드를 활성화하면, 키워드 블럭의 상위 2위까지 계산합니다." />
      {isLoading && <p className="text-sm text-gray-500">로딩 중...</p>}
    </div>
  );
}
