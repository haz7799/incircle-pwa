"use client";

import { useAuthStore } from "@/store/useAuthStore";
import AuthGateway from "@/components/auth/AuthGateway";
import { Search, MapPin, Users, Lock } from "lucide-react";

export default function Home() {
  const { user } = useAuthStore();

  // 若未登入，強制顯示驗證閘道
  if (!user) return <AuthGateway />;

  return (
    <div className="flex flex-col gap-6">
      {/* 搜尋與私密房入口 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-muted" size={20} />
          <input 
            type="text" 
            placeholder="搜尋目的或地點..." 
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <button className="bg-primary text-surface px-4 rounded-xl flex items-center gap-2 font-medium">
          <Lock size={18} />
          私密房
        </button>
      </div>

      {/* 公開房間列表 (Mock Data) */}
      <div className="flex flex-col gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-minimal flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold bg-background px-2 py-1 rounded text-secondary mb-2 inline-block">約飯</span>
              <h3 className="text-lg font-bold text-primary">週末壽喜燒探店</h3>
            </div>
            <span className="text-sm font-medium text-secondary">AA制</span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-secondary">
            <div className="flex items-center gap-2"><MapPin size={14} /> 尖沙咀海港城</div>
            <div className="flex items-center gap-2"><Users size={14} /> 2 / 4 人 (限20-30歲)</div>
          </div>
          <button className="w-full mt-2 py-2 bg-background border border-border text-primary rounded-lg font-medium hover:bg-border transition-colors">
            申請加入
          </button>
        </div>
      </div>
    </div>
  );
}