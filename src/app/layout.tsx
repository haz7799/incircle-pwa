import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";

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
      <body className={`${inter.className} bg-background text-primary antialiased`}>
        <TopBar />
        
        {/* Main Container: 
          使用 pt-14 (閃避 TopBar) 與 pb-24 (閃避 BottomNav)
          max-w-md 確保在 Web 端也能維持 Mobile 般的窄版舒適閱讀體驗 
        */}
        <main className="pt-14 pb-24 min-h-screen max-w-md mx-auto px-4 mt-4">
          {children}
        </main>
        
        <BottomNav />
      </body>
    </html>
  );
}