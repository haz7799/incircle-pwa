"use client";
import InviteModal from "@/components/room/InviteModal";
import SharedMemo from "@/components/room/SharedMemo";
import VoteDecision from "@/components/room/VoteDecision";
import ScheduleSlotMatcher from "@/components/room/ScheduleSlotMatcher";
import BillSettlement from "@/components/room/BillSettlement";
import { useState, use } from "react"; // 引入 React 的 use Hook
import { MessageSquare, Calendar, Receipt, FileText, BarChart2 } from "lucide-react";
import ChatBox from "@/components/room/ChatBox";

// 1. 將 params 修改為 Promise 類型以符合 Next.js 15+ / 16 規範
export default function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  // 2. 使用 React 的 use() 來拆解 Promise 中的 params
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<"chat" | "memo" | "vote" | "schedule" | "bill">("chat");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
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
        <button
        onClick={() => setIsInviteOpen(true)}
        className="text-xs bg-primary text-surface px-3 py-1.5 rounded-xl font-medium shadow-minimal active:scale-[0.98] transition-transform flex items-center gap-1"
        >
         邀請搭子
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

      {/* 動態內容區塊 - 傳入解構後的 roomId */}
      <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border flex flex-col">
        {activeTab === "chat" && <ChatBox roomId={roomId} />}
        {activeTab === "schedule" && <ScheduleSlotMatcher roomId={roomId} />}        
        {activeTab === "bill" && <BillSettlement roomId={roomId} />}        
        {activeTab === "vote" && <VoteDecision roomId={roomId} />}
        {activeTab === "memo" && <SharedMemo roomId={roomId} />}
      </div>

      {isInviteOpen && (
        <InviteModal
        roomId={roomId}
        roomTitle="周末壽喜燒探店"
        onClose={() => setIsInviteOpen(false)}
        />
     )}
    </div>
  );
}