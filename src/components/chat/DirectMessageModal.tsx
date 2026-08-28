"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

interface FriendUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt?: {
    seconds: number;
  };
}

export default function DirectMessageModal({ 
  friend, 
  onClose 
}: { 
  friend: FriendUser; 
  onClose: () => void; 
}) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 計算唯一的雙人對話頻道 ID
  const chatId = user ? [user.uid, friend.uid].sort().join("_") : "";

  // 即時監聽對話紀錄
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: Message[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Message[];
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 自動置底捲動
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: inputText.trim(),
        createdAt: serverTimestamp(),
      });
      setInputText("");
    } catch (err) {
      console.error("發送訊息失敗:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm h-[80vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        
        {/* 對話框頂部 Bar */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
              {friend.photoURL ? (
                <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-secondary" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-primary">{friend.displayName}</h3>
              <p className="text-[10px] text-muted">好友私訊</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-muted hover:text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 訊息氣泡滾動區域 */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-background no-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-xs text-muted">
              打個招呼吧！開始與 {friend.displayName} 的對話
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                      isMe
                        ? "bg-primary text-surface rounded-br-none"
                        : "bg-surface border border-border text-primary rounded-bl-none shadow-minimal"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 訊息輸入框 */}
        <form onSubmit={handleSendMessage} className="p-2.5 bg-surface border-t border-border flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="輸入訊息..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="bg-primary text-surface p-2 rounded-xl text-xs font-medium disabled:opacity-50 shrink-0"
          >
            <Send size={14} />
          </button>
        </form>

      </div>
    </div>
  );
}