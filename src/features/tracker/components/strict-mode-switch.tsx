"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionMarkTooltip } from "@/components/custom-ui/question-tooltip";

export function StrictModeSwitch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 URL 쿼리에 mode=strict가 있는지 체크
  const isStrictMode = searchParams.get("mode") === "strict";

  // 스위치가 토글될 때 호출
  const handleStrictModeToggle = (checked: boolean) => {
    // 현재 쿼리 파라미터를 복사해서 수정
    const params = new URLSearchParams(searchParams.toString());

    if (checked) {
      // mode=strict 추가
      params.set("mode", "strict");
    } else {
      // mode 파라미터 제거
      params.delete("mode");
    }

    // 업데이트된 쿼리 파라미터를 적용해 라우터 이동
    const nextUrl = `${pathname}?${params.toString()}`;
    router.push(nextUrl);
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="strictMode"
        checked={isStrictMode}
        onCheckedChange={handleStrictModeToggle}
      />
      <Label htmlFor="strictMode">엄격 모드</Label>
      <QuestionMarkTooltip content="엄격 모드를 활성화하면, 키워드 블럭의 상위 2위까지 계산합니다." />
    </div>
  );
}
