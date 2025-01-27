"use client";

import React, { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectMenu } from "@/features/projects/types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProject } from "@/features/projects/actions/add-project";
import { checkProjectSlug } from "@/features/projects/actions/check-project-slug";

// 랜덤 8자리 영숫자 생성 함수
function generateRandomSlug(length: number = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

interface ProjectAddDialogProps {
  profileId: string;
  onClose: () => void;
  open: boolean;
  onOptimisticAdd: (project: ProjectMenu) => void;
  onRollbackAdd: (slug: string) => void;
  onReplaceOptimisticProject: (
    tempId: string,
    actualProject: ProjectMenu
  ) => void;
}

export function ProjectAddDialog({
  profileId,
  onClose,
  open,
  onOptimisticAdd,
  onRollbackAdd,
  onReplaceOptimisticProject,
}: ProjectAddDialogProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [slugCheckError, setSlugCheckError] = useState(false);

  // 다이얼로그가 마운트될 때 랜덤 slug 생성
  useEffect(() => {
    if (open) generateAndCheckSlug();
  }, [open]);

  // 슬러그를 생성하고 중복 여부를 체크하는 함수
  const generateAndCheckSlug = async () => {
    let newSlug = generateRandomSlug();
    let isDuplicate = true;

    try {
      // 중복이 아닐 때까지 슬러그 생성 & 체크 반복
      while (isDuplicate) {
        const { check } = await checkProjectSlug(newSlug);
        if (!check) {
          isDuplicate = false; // 중복되지 않으면 루프 종료
        } else {
          newSlug = generateRandomSlug(); // 중복이면 새로운 슬러그 생성
        }
      }

      setProjectSlug(newSlug);
      setSlugCheckError(false); // 중복 확인 오류 상태 초기화
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugCheckError(true); // 중복 확인 중 오류 발생 시 플래그 설정
    }
  };

  const handleSave = async () => {
    if (!projectName || !projectSlug) return;

    const optimisticProject = {
      id: `temp-${projectSlug}`, // 임시 ID 생성
      name: projectName,
      slug: projectSlug,
    } as ProjectMenu;

    startTransition(async () => {
      onOptimisticAdd(optimisticProject);

      setIsSaving(true);
      try {
        // 서버 요청
        const addedProject = await addProject({
          profileId,
          projectName,
          projectSlug,
        });

        const newProject = {
          id: addedProject.id,
          url: `/${addedProject.slug}/tracker`,
          isActive: false,
        } as ProjectMenu;

        // 서버에서 반환된 실제 데이터로 낙관적 프로젝트 교체
        onReplaceOptimisticProject(optimisticProject.id, newProject);

        onClose();
        router.push(newProject.url); // 선택한 프로젝트로 이동
      } catch (error) {
        console.error("Error adding project:", error);

        // 실패 시: 원복(rollback)
        onRollbackAdd(projectSlug);
      } finally {
        setIsSaving(false);
        setProjectName("");
        generateAndCheckSlug(); // 새로운 슬러그 생성 및 중복 확인
      }
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>새 프로젝트 추가</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col space-y-4">
        <p className="text-sm text-gray-600">새 프로젝트 이름을 입력하세요.</p>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="projectName">프로젝트 이름</Label>
          <Input
            id="projectName"
            placeholder="고객사 이름, 브랜드명 등"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        {slugCheckError && (
          <p className="text-sm text-red-500">
            슬러그 중복 확인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}
        <Button
          variant="default"
          className="self-end"
          onClick={handleSave}
          disabled={!projectName || isSaving || slugCheckError}
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </DialogContent>
  );
}
