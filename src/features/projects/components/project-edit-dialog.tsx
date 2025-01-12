"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import {
  projectsAtom,
  currentProjectAtom,
} from "@/features/projects/atoms/state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/features/projects/actions/update-project";
import { softDeleteProject } from "@/features/projects/actions/soft-delete-project";
import { ProjectMenu } from "@/features/projects/types/types";

interface ProjectEditDialogProps {
  project: ProjectMenu;
  onClose: () => void;
  open: boolean;

  // 낙관적 업데이트 및 원복을 위한 콜백
  onOptimisticUpdate: (projectId: string, newName: string) => void;
  onOptimisticDelete: (projectId: string) => void;
  onRollbackUpdate: (projectId: string, originalName: string) => void;
  onRollbackDelete: (projectId: string) => void;
}

export function ProjectEditDialog({
  project,
  onClose,
  open,
  onOptimisticUpdate,
  onOptimisticDelete,
  onRollbackUpdate,
  onRollbackDelete,
}: ProjectEditDialogProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(project.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useRecoilState(projectsAtom);
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectAtom);

  // useTransition: 비동기 상태 전환 관리
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!projectName) return;

    const originalName = project.name;

    // 2) 서버 요청
    startTransition(async () => {
      onOptimisticUpdate(project.id, projectName);

      try {
        await updateProject(project.id, { name: projectName });
        // 서버 요청이 성공하면 아무 작업도 하지 않음 (낙관적 UI 유지)
      } catch (error) {
        console.error("Error updating project:", error);
        // 실패 시 원복 (rollback)
        onRollbackUpdate(project.id, originalName);
      } finally {
        onClose();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) return;

    setIsDeleting(true);

    startTransition(async () => {
      onOptimisticDelete(project.id);

      try {
        await softDeleteProject(project.id);

        // 삭제 성공 시 첫 번째 프로젝트로 이동
        const updatedProjects = projects.filter((p) => p.id !== project.id);
        if (updatedProjects.length > 0) {
          const firstProject = updatedProjects[0];
          setCurrentProject(firstProject);
          router.push(firstProject.url); // 첫 번째 프로젝트로 이동
        } else {
          // 프로젝트가 모두 삭제된 경우 대시보드 초기 경로로 이동
          setCurrentProject(null);
          router.push("/blogs"); // 초기 경로로 설정 (예: /dashboard)
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        onRollbackDelete(project.id);
      } finally {
        setIsDeleting(false);
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로젝트 수정</DialogTitle>
          <DialogDescription>프로젝트를 수정합니다.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="projectName">프로젝트 이름</Label>
            <Input
              id="projectName"
              placeholder="프로젝트 이름을 입력하세요"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isPending || isDeleting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!projectName || isPending || isDeleting}
            >
              {isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
