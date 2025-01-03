"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUser } from "@/hooks/use-logged-in-user";

import { fetchProjects } from "@/features/projects/actions/fetch-projects";
import {
  Rss,
  Frame,
  Users,
  LifeBuoy,
  Send,
  ScanSearch,
  ChartBarDecreasing,
  Settings,
} from "lucide-react";
import { NavUser } from "./nav-user";
import { ProjectSwitcher } from "./project-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/custom-ui/mode-toggle";
import { NavSecondary } from "./nav-secondary";
import { LoggedInUser } from "@/features/common/types/types";

const data = {
  projectSetting: [
    {
      title: "상위노출 추적",
      url: "/tracker",
      icon: ChartBarDecreasing,
    },
    {
      title: "설정",
      url: "/setting",
      icon: Settings,
    },
    // {
    //   title: "카카오 알림",
    //   url: "/kakao",
    //   icon: Send,
    // },
    // {
    //   title: "멤버 관리",
    //   url: "/member",
    //   icon: Users,
    // },
  ],
  navSecondary: [
    {
      title: "고객센터",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "피드백",
      url: "#",
      icon: Send,
    },
    {
      title: "블로그",
      url: "#",
      icon: Send,
    },
    {
      title: "가이드",
      url: "#",
      icon: Send,
    },
    {
      title: "홈페이지",
      url: "#",
      icon: Send,
    },
  ],
};

export type Project = {
  name: string;
  logo: React.ElementType;
  url: string;
  isActive: boolean;
  slug: string;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  const [projects, setProjects] = useState<Project[]>([]);
  const loggedInUser = useLoggedInUser();

  useEffect(() => {
    const _fetchProjects = async () => {
      if (!loggedInUser) return;
      const _projects = await fetchProjects(loggedInUser.profile.id);
      setProjects(
        _projects.map((project) => {
          const basePath = pathname.split("/").slice(1).join("/");

          const newPath =
            basePath === "blogs" || basePath === "keyword"
              ? `/${project.slug}/tracker`
              : `/${project.slug}/${basePath.split("/").slice(1).join("/")}`;

          return {
            name: project.name,
            logo: Frame,
            url: newPath,
            slug: project.slug,
            isActive: pathname.includes(project.slug),
          };
        })
      );
    };
    _fetchProjects();
  }, [loggedInUser, pathname]);

  // Determine the current project
  const currentProject =
    pathname === "/blogs" || pathname === "/keyword"
      ? projects[0]
      : projects.find((project) => pathname.includes(`/${project.slug}`)) ||
        projects[0];

  if (!loggedInUser) return null;
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher
          projects={projects}
          profileId={loggedInUser.profile.id}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>프로젝트 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.projectSetting.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname.includes(item.url)}
                  >
                    <button
                      onClick={() => {
                        if (currentProject) {
                          router.push(`/${currentProject.slug}${item.url}`);
                        }
                      }}
                    >
                      {item.icon && <item.icon />}
                      {item.title}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>키워드 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="키워드 조회"
                  isActive={pathname === "/keyword"}
                >
                  <button onClick={() => router.push("/keyword")}>
                    <ScanSearch />
                    키워드 조회
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>블로그 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="내 블로그"
                  isActive={pathname === "/blogs"}
                >
                  <button onClick={() => router.push("/blogs")}>
                    <Rss />내 블로그
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser loggedInUser={loggedInUser} />
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
