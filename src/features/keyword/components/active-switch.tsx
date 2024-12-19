"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { updateKeywordTracker } from "@/features/keyword/actions/update-keyword-tracker";

interface ActiveSwitchProps {
  trackerId: string;
  isActive: boolean;
  projectSlug: string;
}

export function ActiveSwitch({
  trackerId,
  isActive,
  projectSlug,
}: ActiveSwitchProps) {
  const [active, setActive] = useState(isActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setActive(checked); // Optimistic update
    setIsSaving(true);

    try {
      await updateKeywordTracker(
        trackerId,
        { active: checked },
        `/${projectSlug}/keyword`
      );
    } catch (error) {
      console.error("Failed to update active status:", error);
      setActive(!checked); // Rollback on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Switch
      checked={active}
      onCheckedChange={handleToggle}
      disabled={isSaving}
    />
  );
}
