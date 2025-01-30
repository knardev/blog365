import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "../globals.css";
import { getProfileData } from "@/features/common/actions/get-profile";
import { Providers } from "@/components/provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/custom-ui/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { LoggedInUser } from "@/features/common/types/types";
import { NavHeaderWithTrigger } from "@/components/custom-ui/nav-header-with-trigger";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "캐치블로그 대시보드",
  description: "캐치블로그 대시보드",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedInUser: LoggedInUser | null = await getProfileData();

  if (!loggedInUser) {
    redirect("/login");
  }

  return (
    <html lang="ko">
      <Providers loggedInUser={loggedInUser}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider className="h-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col bg-background">
                <header className="sticky top-0 z-50 bg-background p-4 pb-0">
                  <NavHeaderWithTrigger />
                </header>
                <main className="overflow-auto flex flex-1 p-4">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
          <Toaster />
        </body>
      </Providers>
    </html>
  );
}
