"use client";

// hooks
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRecoilState } from "recoil";
// atoms
import { strictModeAtom } from "@/features/tracker/atoms/states";
// components
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionMarkTooltip } from "@/components/custom-ui/question-tooltip";

export function StrictModeSwitch() {
  const [strictMode, setStrictMode] = useRecoilState(strictModeAtom);
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // useEffect(() => {
  //   const mode = searchParams.get("mode");

  //   if (mode === "strict") {
  //     setStrictMode(true);
  //   } else {
  //     setStrictMode(false);
  //   }
  // }, [searchParams, setStrictMode]);

  // 스위치가 토글될 때 호출
  // const handleStrictModeToggle = (checked: boolean) => {
  //   setIsLoading(true);

  //   const params = new URLSearchParams(searchParams.toString());

  //   if (checked) {
  //     params.set("mode", "strict");
  //   } else {
  //     params.delete("mode");
  //   }

  //   setStrictMode(checked); // 엄격 모드 설정
  //   setIsLoading(false);
  // };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="strictMode"
        checked={strictMode}
        onCheckedChange={setStrictMode}
        disabled={isLoading} // 로딩 중에는 비활성화
      />
      <Label htmlFor="strictMode">엄격 모드</Label>
      <QuestionMarkTooltip content="엄격 모드를 활성화하면, 키워드 블럭의 상위 2위까지 계산합니다." />
      {isLoading && <p className="text-sm text-gray-500">로딩 중...</p>}
    </div>
  );
}
