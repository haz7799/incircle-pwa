"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Ban, Check, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
// import { acceptFriendRequest, blockUser } from "@/lib/social";

type Tab = "friends" | "pending" | "blocked";

export default function SocialManager() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [blockRemark, setBlockRemark] = useState("");
  const [blockingUid, setBlockingUid] = useState<string | null>(null);

  // Mock Data: 實務上請透過 onSnapshot 監聽當前使用者的 users/{uid} 文件
  const pendingRequests = [{ uid: "u5", name: "想約飯的新手" }];
  const friends = [{ uid: "u2", name: "搭子A" }];
  const blocked = [{ uid: "u9", name: "放鳥王", remark: "無故缺席兩次" }];

  const handleBlock = async (uid: string) => {
    if (!blockRemark.trim()) return alert("請填寫封鎖原因");
    // await blockUser(user!.uid, uid, blockRemark);
    setBlockingUid(null);
    setBlockRemark("");
    alert("已封鎖該用戶");
  };

  return (
    <div className="bg-surface rounded-xl border border-border flex flex-col h-[500px]">
      {/* 頂部導覽 */}
      <div className="flex border-b border-border bg-background p-1 rounded-t-xl shrink-0">
        <button onClick={() => setActiveTab("friends")} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === "friends" ? "bg-surface shadow-sm text-primary" : "text-muted"}`}>
          好友列表
        </button>
        <button onClick={() => setActiveTab("pending")} className={`flex-1 flex justify-center items-center gap-1 py-2 text-sm font-medium rounded-lg ${activeTab === "pending" ? "bg-surface shadow-sm text-primary" : "text-muted"}`}>
          待處理 <span className="bg-primary text-surface text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
        </button>
        <button onClick={() => setActiveTab("blocked")} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === "blocked" ? "bg-surface shadow-sm text-primary" : "text-muted"}`}>
          黑名單
        </button>
      </div>

      {/* 列表內容區 */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        
        {activeTab === "pending" && pendingRequests.map(req => (
          <div key={req.uid} className="flex items-center justify-between p-3 border border-border rounded-xl mb-2 bg-background">
            <span className="font-medium text-primary text-sm">{req.name}</span>
            <div className="flex gap-2">
              <button className="p-2 bg-surface border border-border rounded-lg text-primary"><Check size={16} /></button>
              <button className="p-2 bg-surface border border-border rounded-lg text-secondary"><X size={16} /></button>
            </div>
          </div>
        ))}

        {activeTab === "friends" && friends.map(f => (
          <div key={f.uid} className="flex flex-col gap-2 p-3 border border-border rounded-xl mb-2 bg-background">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm">{f.name}</span>
              <div className="flex gap-2">
                <button className="p-1.5 text-secondary border border-border rounded bg-surface"><UserPlus size={14} /></button>
                <button onClick={() => setBlockingUid(f.uid)} className="p-1.5 text-red-500 border border-border rounded bg-surface"><Ban size={14} /></button>
              </div>
            </div>
            
            {/* 展開封鎖輸入框 */}
            {blockingUid === f.uid && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                <input 
                  type="text" 
                  placeholder="備註封鎖原因..." 
                  value={blockRemark}
                  onChange={(e) => setBlockRemark(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded text-xs px-2 focus:outline-none"
                />
                <button onClick={() => handleBlock(f.uid)} className="text-xs bg-primary text-surface px-3 py-1 rounded">確認封鎖</button>
              </div>
            )}
          </div>
        ))}

        {activeTab === "blocked" && blocked.map(b => (
          <div key={b.uid} className="flex flex-col p-3 border border-border rounded-xl mb-2 bg-background opacity-70">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm line-through">{b.name}</span>
              <button className="text-[10px] text-secondary border border-border px-2 py-1 rounded bg-surface">解除</button>
            </div>
            <span className="text-xs text-muted mt-1 flex gap-1 items-center"><UserMinus size={12} /> 原因: {b.remark}</span>
          </div>
        ))}

      </div>
    </div>
  );
}