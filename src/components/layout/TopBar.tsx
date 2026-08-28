"use client";

import { usePathname } from "next/navigation";

export default function TopBar() {
  const pathname = usePathname();
  
  // 簡單的路由標題映射
  const getTitle = () => {
    switch (pathname) {
      case "/": return "局內 InCircle";
      case "/create": return "開啟房間";
      case "/schedule": return "我的行程";
      case "/profile": return "個人主頁";
      default: return "局內";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-b border-border z-50 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center justify-center h-14 max-w-md mx-auto px-4">
        <h1 className="text-lg font-bold text-primary tracking-wide">
          {getTitle()}
        </h1>
      </div>
    </header>
  );
}