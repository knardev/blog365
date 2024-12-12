import type { Metadata } from "next";
import { redirect } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import { Tables } from "@/types/database.types";
import { getProfileData } from "@/actions/get-profile";
import { Providers } from "@/components/provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/custom-ui/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

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
  type Profile = Tables<"profiles">;
  const profile: Profile | null = await getProfileData();

  if (!profile) {
    redirect("/login");
  }

  return (
    <html lang="ko">
      <Providers>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar profile={profile} />
              <SidebarInset>
                <main className="p-4 overflow-auto h-screen">
                  <SidebarTrigger />
                  {children}
                  <Toaster />
                </main>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </Providers>
    </html>
  );
}
