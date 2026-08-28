"use client";

import { Star, Settings, UserPlus, LogOut } from "lucide-react";

export default function Profile() {
  return (
    <div className="flex flex-col gap-6">
      {/* 頂部個人名片 */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-minimal flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-background rounded-full border-2 border-border flex items-center justify-center text-2xl font-bold text-secondary">
          IN
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary">InCircle 用戶</h2>
          <p className="text-sm text-secondary mt-1">香港 · 24歲 · 偏好約飯</p>
        </div>
        
        <div className="flex gap-8 mt-2 w-full justify-center border-t border-border pt-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary flex items-center gap-1">
              4.95 <Star size={16} fill="currentColor" className="text-primary" />
            </span>
            <span className="text-xs text-secondary">信譽評分</span>
          </div>
          <div className="w-px bg-border"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">12</span>
            <span className="text-xs text-secondary">完成局數</span>
          </div>
        </div>
      </div>

      {/* 功能選單 */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <button className="w-full flex items-center justify-between p-4 border-b border-border active:bg-background">
          <div className="flex items-center gap-3 text-primary font-medium">
            <UserPlus size={18} /> 新增好友
          </div>
          <span className="text-xs text-muted">管理名單</span>
        </button>
        <button className="w-full flex items-center gap-3 p-4 border-b border-border active:bg-background text-primary font-medium">
          <Settings size={18} /> 帳號設定
        </button>
        <button className="w-full flex items-center gap-3 p-4 active:bg-background text-red-500 font-medium">
          <LogOut size={18} /> 登出
        </button>
      </div>
    </div>
  );
}