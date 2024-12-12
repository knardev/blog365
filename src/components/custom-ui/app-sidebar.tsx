"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tables } from "@/types/database.types";
import { fetchProjects } from "@/features/projects/actions/fetch-projects";
import {
  Rss,
  Frame,
  Users,
  LifeBuoy,
  Send,
  ScanSearch,
  ChartBarDecreasing,
} from "lucide-react";

import { NavCollapsibleMain } from "./nav-collapsible-main";
import { NavProjects } from "./nav-projects";
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  projectSetting: [
    {
      title: "캐치 트래커",
      url: "/catch",
      icon: ChartBarDecreasing,
    },
    {
      title: "키워드 세팅",
      url: "/keyword",
      icon: ScanSearch,
    },
    {
      title: "카카오 알림",
      url: "/kakao",
      icon: Send,
    },
    {
      title: "멤버 관리",
      url: "/member",
      icon: Users,
    },
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

type Profile = Tables<"profiles">;

export function AppSidebar({
  profile,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  profile: Profile;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const _fetchProjects = async () => {
      const _projects = await fetchProjects(profile.id);
      setProjects(
        _projects.map((project) => {
          const basePath = pathname.split("/").slice(1).join("/");

          const newPath =
            basePath === "blogs"
              ? `/${project.slug}/catch`
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
  }, [profile.id, pathname]);

  // Determine the current project
  const currentProject =
    pathname === "/blogs"
      ? projects[0]
      : projects.find((project) => pathname.includes(`/${project.slug}`)) ||
        projects[0];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher projects={projects} />
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
