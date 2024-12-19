"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProject } from "@/features/projects/actions/add-project";

export function ProjectAddDialog({
  profileId,
  revalidateTargetPath,
  onClose,
}: {
  profileId: string;
  revalidateTargetPath?: string;
  onClose: () => void; // Function to close the dialog from the parent
}) {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!projectName || !projectSlug) return;

    setIsSaving(true);
    try {
      await addProject({
        profileId,
        projectName,
        projectSlug,
        revalidateTargetPath,
      });
      onClose(); // Close the dialog after saving
    } catch (error) {
      console.error("Error adding project:", error);
    } finally {
      setIsSaving(false);
      setProjectName("");
      setProjectSlug("");
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>새 프로젝트 추가</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col space-y-4">
        <p className="text-sm text-gray-600">
          새 프로젝트 이름과 프로젝트 ID를 입력하세요.
        </p>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="projectName">프로젝트 이름</Label>
          <Input
            id="projectName"
            placeholder="예: 내 프로젝트"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="projectSlug">프로젝트 ID</Label>
          <Input
            id="projectSlug"
            placeholder="예: my-project"
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <Button
          variant="default"
          className="self-end"
          onClick={handleSave}
          disabled={!projectName || !projectSlug || isSaving}
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </DialogContent>
  );
}
