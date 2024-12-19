"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LoggedInUser } from "@/features/common/types/types";
import { signOut } from "@/app/(auth)/actions";

export function NavUser({
  loggedInUser,
}: {
  loggedInUser: LoggedInUser | null;
}) {
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarMenu>
      {loggedInUser ? (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={loggedInUser.profile.profile_image_url ?? ""}
                    alt={loggedInUser.user.user_metadata.name ?? ""}
                  />
                  <AvatarFallback className="rounded-lg">CB</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {loggedInUser.user.user_metadata.name ??
                      loggedInUser.user.user_metadata.email}
                  </span>
                  <span className="truncate text-xs">
                    {loggedInUser.user.user_metadata.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="right"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={loggedInUser.profile.profile_image_url ?? ""}
                      alt={loggedInUser.user.user_metadata.name ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">CB</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {loggedInUser.user.user_metadata.name ?? "고객님"}
                    </span>
                    <span className="truncate text-xs">
                      {loggedInUser.user.user_metadata.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  프로 업그레이드
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BadgeCheck />
                  계정관리
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  구독관리
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <Bell />
                  알림
                </DropdownMenuItem> */}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ) : (
        <SidebarMenuItem>
          <div className="flex flex-col items-center">
            <span>로그인이 필요합니다.</span>
          </div>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
