"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMessageTarget } from "@/features/kakao/actions/add-message-targets";
import { revalidatePath } from "next/cache";

export function AddMessageTargetInput({
  projectSlug,
}: {
  projectSlug: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTarget = async () => {
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      const newTarget = await addMessageTarget(
        projectSlug,
        phoneNumber,
        `/${projectSlug}/setting`
      );

      if (newTarget) {
        setPhoneNumber("");
      }
    } catch (error) {
      console.error("Error adding message target:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Input
        type="text"
        placeholder="전화번호 입력"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        disabled={isLoading || isPending}
      />
      <Button
        onClick={handleAddTarget}
        disabled={isLoading || isPending}
        className="whitespace-nowrap"
      >
        {isLoading ? "추가 중..." : "추가"}
      </Button>
    </div>
  );
}
