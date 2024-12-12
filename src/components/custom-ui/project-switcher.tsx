"use client";

import { useState, useEffect } from "react";
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

export function ProjectSwitcher({ projects }: { projects: Project[] }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const [activeProject, setActiveProject] = useState<Project>({
    name: "프로젝트가 없습니다",
    logo: Frame,
    url: "#",
    slug: "",
    isActive: false,
  });

  useEffect(() => {
    if (projects.length !== 0) {
      const activeSlug = pathname.split("/")[1];
      const matchingProject = projects.find(
        (project) => project.slug === activeSlug
      );

      if (matchingProject) {
        setActiveProject(matchingProject);
      } else {
        setActiveProject(projects[0]);
      }
    } else {
      setActiveProject({
        name: "프로젝트가 없습니다",
        logo: Frame,
        url: "#",
        slug: "",
        isActive: false,
      });
    }
  }, [projects, pathname]);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    router.push(project.url); // Navigate to the selected project's URL
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
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
              ? projects.map((project, index) => (
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
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push("/add-project")} // Example route for adding a new project
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                프로젝트 추가
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
