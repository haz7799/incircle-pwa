"use client";

import { useAuthStore } from "@/store/useAuthStore";
import AuthLanding from "@/components/auth/AuthLanding";
import { Plus, Users, Search } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 未登入用戶：顯示引導頁面
  if (!user) {
    return <AuthLanding />;
  }

  // 已登入用戶：顯示正常 App 主頁面
  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">探索約局</h1>
          <p className="text-xs text-secondary mt-1">找尋附近同頻搭子</p>
        </div>
        <button className="bg-primary text-surface px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-minimal">
          <Plus size={16} /> 發起局
        </button>
      </div>

      {/* 房間列表與其他卡片... */}
    </div>
  );
}