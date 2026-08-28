import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import AuthGuard from "@/components/auth/AuthGuard";

// 使用系統預設無襯線字體，保持極簡
const inter = Inter({ subsets: ["latin"] });

// PWA Viewport 設定：防止使用者雙擊放大，固定主題色
export const viewport: Viewport = {
  themeColor: "#f5f5f5", // 呼應 tailwind.config.ts 的 background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "局內 InCircle - 同頻約局 PWA",
  description: "尋找同頻搭子，輕鬆組局、記帳與投票。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "局內",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased bg-background text-primary selection:bg-primary selection:text-surface">
        <div className="mx-auto max-w-md min-h-screen bg-surface shadow-2xl relative overflow-x-hidden pb-16">
          {/* 使用 AuthGuard 包裹所有內容 */}
          <AuthGuard>
            <main className="p-4">{children}</main>
            <BottomNav />
          </AuthGuard>
        </div>
      </body>
    </html>
  );
}