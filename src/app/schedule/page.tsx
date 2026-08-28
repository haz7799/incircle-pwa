"use client";

import { Calendar, Clock, ChevronRight } from "lucide-react";

export default function Schedule() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 border-b border-border pb-2">
        <button className="text-primary font-bold border-b-2 border-primary pb-2 px-1">進行中 (2)</button>
        <button className="text-muted font-medium pb-2 px-1">歷史紀錄</button>
      </div>

      <div className="flex flex-col gap-3">
        {/* 房間卡片 */}
        <div className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between active:bg-background transition-colors cursor-pointer">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-primary">五月天演唱會搭子</h3>
            <div className="flex items-center gap-3 text-xs text-secondary">
              <span className="flex items-center gap-1"><Calendar size={12} /> 尚未定檔</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 投票中</span>
            </div>
          </div>
          <ChevronRight className="text-muted" size={20} />
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between active:bg-background transition-colors cursor-pointer">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-primary">港島 City Walk</h3>
            <div className="flex items-center gap-3 text-xs text-secondary">
              <span className="flex items-center gap-1"><Calendar size={12} /> 10/24 14:00</span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary text-surface rounded">已成局</span>
            </div>
          </div>
          <ChevronRight className="text-muted" size={20} />
        </div>
      </div>
    </div>
  );
}