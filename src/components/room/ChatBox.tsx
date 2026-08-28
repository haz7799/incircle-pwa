"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}

export default function ChatBox({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // 實時監聽訊息
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "rooms", roomId, "chats"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 自動捲動至底端
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const msgText = input.trim();
    setInput(""); // 樂觀 UI 更新：先清空輸入框

    await addDoc(collection(db, "rooms", roomId, "chats"), {
      text: msgText,
      senderId: user.uid,
      authorName: user.displayName || "局內搭子", // <--- 替換成這行
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-muted mb-1 px-1">{msg.senderName}</span>
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMe 
                    ? "bg-primary text-surface rounded-tr-none" 
                    : "bg-background text-primary border border-border rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* 輸入區塊 */}
      <form onSubmit={sendMessage} className="p-3 border-t border-border bg-surface flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入訊息..."
          className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary text-primary"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="bg-primary text-surface p-2.5 rounded-full disabled:opacity-50 transition-opacity"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}