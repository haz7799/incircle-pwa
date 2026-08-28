"use client";

import { useAuthStore } from "@/store/useAuthStore";
import AuthLanding from "@/components/auth/AuthLanding";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 避免伺服器與客戶端渲染不一致 (Hydration mismatch)
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 若未登入，強制渲染 AuthLanding，攔截所有 children 內容
  if (!user) {
    return <AuthLanding />;
  }

  // 若已登入，正常渲染子路由
  return <>{children}</>;
}