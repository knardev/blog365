// src/app/share/[project_slug]/layout.tsx
import localFont from "next/font/local";
import "../globals.css";
import { Providers } from "@/components/provider";

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

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <Providers>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        >
          <div className="flex flex-col h-full">
            <main className="overflow-auto flex flex-1 p-4">{children}</main>
          </div>
        </body>
      </Providers>
    </html>
  );
}
