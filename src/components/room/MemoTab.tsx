"use client";

import { useState } from "react";
import { FileText, Pin, Send } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface Memo {
  id: string;
  content: string;
  authorName: string;
  isPinned: boolean;
  isHighlight: boolean;
}

export default function MemoTab({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [input, setInput] = useState("");

  // Mock Data
  const [memos, setMemos] = useState<Memo[]>([
    { id: "m1", content: "記得帶環保餐具！", authorName: "房主", isPinned: true, isHighlight: true },
    { id: "m2", content: "預計晚上 7 點在捷運站 2 號出口集合", authorName: "搭子A", isPinned: false, isHighlight: false },
  ]);

  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    // 實務寫入 Firestore: addDoc(collection(db, "rooms", roomId, "memos"), {...})
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <FileText size={20} className="text-primary" />
        <h3 className="font-bold text-primary">房間記事</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-background">
        {memos.map(memo => (
          <div 
            key={memo.id} 
            className={`p-3 rounded-xl border relative ${
              memo.isHighlight ? "border-primary bg-primary text-surface" : "border-border bg-surface text-primary"
            }`}
          >
            {memo.isPinned && (
              <Pin size={14} className={`absolute top-3 right-3 ${memo.isHighlight ? "text-surface" : "text-primary"}`} />
            )}
            <p className="text-sm font-medium pr-6">{memo.content}</p>
            <span className={`text-[10px] mt-2 block ${memo.isHighlight ? "text-surface/80" : "text-muted"}`}>
              來自 {memo.authorName}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddMemo} className="p-3 border-t border-border bg-surface flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="新增記事..."
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-primary"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="bg-primary text-surface px-4 rounded-lg disabled:opacity-50 font-medium"
        >
          新增
        </button>
      </form>
    </div>
  );
}