"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRecoilState } from "recoil";
import { currentProjectAtom } from "@/features/common/atoms/state";
import type { Project } from "./app-sidebar";
import { ChevronsUpDown, Plus, Frame } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ProjectAddDialog } from "@/features/projects/components/project-add-dialog";

interface ProjectSwitcherProps {
  projects: Project[];
  profileId: string;
}

export function ProjectSwitcher({ projects, profileId }: ProjectSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectAtom);

  // const [activeProject, setActiveProject] = useState<Project>({
  //   name: "프로젝트를 선택하세요",
  //   logo: Frame,
  //   url: "#",
  //   slug: "",
  //   isActive: false,
  // });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleProjectSelect = (project: Project) => {
    // setActiveProject(project);
    setCurrentProject(project);
    router.push(project.url); // Navigate to the selected project's URL
  };

  /**
   * 1) 컴포넌트 마운트 시,
   *    - projects 배열이 있는 경우 -> 첫 번째 프로젝트를 기본 선택
   *    - blogs, keyword 페이지인 경우 -> 기존 activeProject 유지
   */
  // useEffect(() => {
  //   if (projects.length === 0) return;

  //   // 현재 activeProject가 "프로젝트를 선택하세요"라면,
  //   // projects[0]를 세팅 (처음 마운트 시).
  //   if (activeProject.slug === "" && projects[0]) {
  //     setActiveProject(projects[0]);
  //   }
  // }, [projects, activeProject.slug]);

  // 1) 프로젝트 목록이 로드되었고, currentProject가 아직 null이면 첫번째 프로젝트로 설정(옵션)
  useEffect(() => {
    if (projects.length === 0) return;
    if (!currentProject) {
      // 첫 번째 프로젝트 자동 선택 (원하지 않으면 이 로직 제거)
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  /**
   * 2) pathname이 바뀔 때마다,
   *    - "/blogs", "/keyword" 경로인 경우엔 기존 activeProject 유지
   *    - "/[project_slug]/tracker"인 경우 project_slug에 맞는 프로젝트 찾기
   */
  // useEffect(() => {
  //   if (pathname.startsWith("/blogs") || pathname.startsWith("/keyword")) {
  //     // blogs, keyword 경로에서는 기존 activeProject 유지
  //     return;
  //   }

  //   // 예: /myProject/tracker => project_slug = "myProject"
  //   // 1) URL을 슬래시로 나누기
  //   const pathParts = pathname.split("/").filter(Boolean);

  //   // 예: ["myProject", "tracker"]
  //   if (pathParts.length > 0) {
  //     const potentialSlug = pathParts[0];
  //     // 2) projects에서 해당 slug를 찾기
  //     const foundProject = projects.find((proj) => proj.slug === potentialSlug);

  //     // 3) 찾은 경우에만 activeProject를 갱신
  //     if (foundProject) {
  //       setActiveProject(foundProject);
  //     }
  //   }
  // }, [pathname, projects]);

  // 표시할 프로젝트 명/로고
  const activeName = currentProject?.name || "프로젝트를 선택하세요";
  const ActiveLogo = currentProject?.logo || Frame;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                프로젝트
              </DropdownMenuLabel>
              {projects.length !== 0
                ? projects.map((project) => (
                    <DropdownMenuItem
                      key={project.slug}
                      onClick={() => handleProjectSelect(project)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <project.logo className="size-4 shrink-0" />
                      </div>
                      {project.name}
                    </DropdownMenuItem>
                  ))
                : null}
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
          <ProjectAddDialog
            profileId={profileId}
            onClose={() => setDialogOpen(false)}
            revalidateTargetPath={pathname}
          />
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
