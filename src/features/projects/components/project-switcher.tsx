"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import {
  projectsAtom,
  currentProjectAtom,
} from "@/features/projects/atoms/state";
import type { ProjectMenu } from "@/features/projects/types/types";
import { ChevronsUpDown, Plus, MoreHorizontal, Frame } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ProjectAddDialog } from "@/features/projects/components/project-add-dialog";
import { ProjectEditDialog } from "@/features/projects/components/project-edit-dialog";

interface ProjectSwitcherProps {
  profileId: string;
}

export function ProjectSwitcher({ profileId }: ProjectSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Recoil 아톰 구독
  const [projects, setProjects] = useRecoilState(projectsAtom);
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectAtom);
  // Dialog 상태 관리
  // const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectMenu | null>(
    null
  );

  // 현재 선택된 프로젝트의 이름과 로고
  const activeName = currentProject?.name || "프로젝트를 선택하세요";
  const ActiveLogo = currentProject?.logo || Frame;

  /** 프로젝트 선택 핸들러 */
  const handleProjectSelect = (project: ProjectMenu) => {
    setCurrentProject(project); // 현재 프로젝트 설정
    router.push(project.url); // 선택한 프로젝트로 이동
  };

  /** 프로젝트 수정 핸들러 */
  const handleEditProject = (project: ProjectMenu) => {
    setSelectedProject(project);
    setEditDialogOpen(true); // 수정 다이얼로그 열기
  };

  /** 프로젝트 추가 다이얼로그 닫기 핸들러 */
  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  /** 프로젝트 수정 다이얼로그 닫기 핸들러 */
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  /** 낙관적 UI: 프로젝트 이름 수정 핸들러 */
  const handleOptimisticUpdate = (projectId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
    );
  };

  /** 낙관적 UI: 프로젝트 삭제 핸들러 */
  const [lastDeletedProject, setLastDeletedProject] =
    useState<ProjectMenu | null>(null);

  const handleOptimisticDelete = (projectId: string) => {
    const projectToDelete = projects.find((p) => p.id === projectId);
    if (projectToDelete) {
      setLastDeletedProject(projectToDelete); // 삭제 전 프로젝트 임시 저장
      setProjects((prev) => prev.filter((p) => p.id !== projectId)); // 낙관적 삭제
      if (currentProject?.id === projectId) {
        setCurrentProject(null); // 현재 선택된 프로젝트가 삭제된 경우 초기화
      }
    }
  };

  const handleOptimisticAdd = (project: ProjectMenu) => {
    setProjects((prev) => [...prev, project]); // 낙관적으로 프로젝트 추가
  };

  const handleReplaceOptimisticProject = (
    tempId: string,
    actualProject: ProjectMenu
  ) => {
    setProjects(
      (prev) => prev.map((p) => (p.id === tempId ? actualProject : p)) // 임시 프로젝트 교체
    );
  };

  /** 서버 요청 실패 시 원복: 프로젝트 이름 수정 핸들러 */
  const handleRollbackUpdate = (projectId: string, originalName: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: originalName } : p))
    );
  };

  /** 서버 요청 실패 시 원복: 프로젝트 삭제 핸들러 */
  const handleRollbackDelete = () => {
    if (lastDeletedProject) {
      setProjects((prev) => [...prev, lastDeletedProject]); // 삭제 원복
      setLastDeletedProject(null); // 원복 후 초기화
    }
  };

  const handleRollbackAdd = (slug: string) => {
    setProjects((prev) => prev.filter((p) => p.slug !== slug)); // 실패 시 원복
  };

  /** URL 변경 시 currentProject 동기화 */
  useEffect(() => {
    if (!pathname || projects.length === 0) return;

    // URL에 포함된 slug로 현재 프로젝트를 찾기
    const slug = pathname.split("/")[1];
    const updatedCurrentProject = projects.find((p) => p.slug === slug);

    if (updatedCurrentProject) {
      setCurrentProject(updatedCurrentProject);
    }
  }, [pathname, projects, setCurrentProject]);

  /** 최초 로드 시 첫 번째 프로젝트 선택 */
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          {/* 드롭다운 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ActiveLogo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{activeName}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                프로젝트 선택
              </DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.slug}
                  onClick={() => handleProjectSelect(project)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <project.logo className="size-4 shrink-0" />
                  </div>
                  <span className="flex-1">{project.name}</span>
                  <MoreHorizontal
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // 드롭다운 닫힘 방지
                      handleEditProject(project);
                    }}
                  />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <DialogTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Plus className="mr-2 size-4" />새 프로젝트 추가
                  </div>
                </DialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 프로젝트 추가 다이얼로그 */}
          <ProjectAddDialog
            profileId={profileId}
            onClose={handleAddDialogClose}
            open={addDialogOpen}
            onOptimisticAdd={handleOptimisticAdd}
            onRollbackAdd={handleRollbackAdd}
            onReplaceOptimisticProject={handleReplaceOptimisticProject}
          />

          {/* 프로젝트 수정 다이얼로그 */}
          {selectedProject && (
            <ProjectEditDialog
              key={selectedProject.id}
              project={selectedProject}
              onClose={handleEditDialogClose}
              open={editDialogOpen}
              onOptimisticUpdate={handleOptimisticUpdate}
              onOptimisticDelete={handleOptimisticDelete}
              onRollbackUpdate={handleRollbackUpdate}
              onRollbackDelete={handleRollbackDelete}
            />
          )}
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
