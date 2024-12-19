"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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

export function ProjectSwitcher({
  projects,
  profileId,
}: {
  projects: Project[];
  profileId: string;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const [activeProject, setActiveProject] = useState<Project>({
    name: "프로젝트를 선택하세요",
    logo: Frame,
    url: "#",
    slug: "",
    isActive: false,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    router.push(project.url); // Navigate to the selected project's URL
  };

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
                  <activeProject.logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeProject.name}
                  </span>
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
                      key={project.name}
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
