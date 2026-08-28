"use client";

import { useState } from "react";
import { MessageSquare, Calendar, Receipt, FileText, BarChart2 } from "lucide-react";
import ChatBox from "@/components/room/ChatBox";

export default function RoomDetail({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"chat" | "memo" | "vote" | "schedule" | "bill">("chat");

  const tabs = [
    { id: "chat", icon: MessageSquare, label: "聊天" },
    { id: "schedule", icon: Calendar, label: "空擋" },
    { id: "bill", icon: Receipt, label: "記帳" },
    { id: "vote", icon: BarChart2, label: "投票" },
    { id: "memo", icon: FileText, label: "記事" },
  ] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      {/* 房間標題與狀態 */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-minimal mb-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-primary">週末壽喜燒探店</h2>
          <p className="text-xs text-secondary mt-1">4 人已加入 · 尖沙咀</p>
        </div>
        <button className="text-xs bg-primary text-surface px-3 py-1.5 rounded-lg font-medium">
          約定組局
        </button>
      </div>

      {/* 功能頁籤 */}
      <div className="flex bg-surface border border-border rounded-lg p-1 mb-4 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-md transition-colors ${
                isActive ? "bg-background shadow-sm text-primary font-bold" : "text-muted"
              }`}
            >
              <Icon size={18} className="mb-1" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 動態內容區塊 */}
      <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border flex flex-col">
        {activeTab === "chat" && <ChatBox roomId={params.id} />}
        {activeTab === "schedule" && <div className="p-4 text-center text-secondary">空擋比對系統開發中...</div>}
        {activeTab === "bill" && <div className="p-4 text-center text-secondary">分帳系統開發中...</div>}
        {activeTab === "vote" && <div className="p-4 text-center text-secondary">投票系統開發中...</div>}
        {activeTab === "memo" && <div className="p-4 text-center text-secondary">記事本開發中...</div>}
      </div>
    </div>
  );
}