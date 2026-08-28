"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Receipt, 
  Star, 
  ChevronRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AuthLanding from "@/components/auth/AuthLanding";

interface EndedRoom {
  id: string;
  title: string;
  category: string;
  endedAt?: string;
  date?: string;
  memberCount: number;
  totalExpense?: number;
  hostName: string;
  userRated?: boolean;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [rooms, setRooms] = useState<EndedRoom[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        // 查詢當前使用者參與且狀態為已結束的房間
        const q = query(
          collection(db, "rooms"),
          where("members", "array-contains", user.uid),
          where("status", "==", "ended")
        );

        const snapshot = await getDocs(q);
        const historyData: EndedRoom[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "未命名組局",
            category: data.category || "社交",
            endedAt: data.endedAt ? new Date(data.endedAt.seconds * 1000).toLocaleDateString() : "未知時間",
            date: data.date || "已完結",
            memberCount: data.members?.length || 0,
            totalExpense: data.totalExpense || 0,
            hostName: data.hostName || "房主",
            userRated: data.ratedUsers?.includes(user.uid) || false,
          };
        });

        setRooms(historyData);
      } catch (err) {
        console.error("讀取歷史紀錄失敗:", err);
      } finally {
        setFetching(false);
      }
    }

    fetchHistory();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthLanding />;
  }

  return (
    <div className="space-y-5 pb-24">
      {/* 頁頭導覽 */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/profile"
          className="p-2 border border-border rounded-xl bg-surface text-primary hover:bg-background transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">歷史組局</h1>
          <p className="text-xs text-secondary mt-0.5">回顧過往參與過的聚會與紀錄</p>
        </div>
      </div>

      {/* 列表內容 */}
      {fetching ? (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-3 my-4">
          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto text-muted">
            <Clock size={24} />
          </div>
          <p className="text-sm font-medium text-primary">尚無歷史組局紀錄</p>
          <p className="text-xs text-secondary max-w-[220px] mx-auto leading-relaxed">
            當你參與的組局完結後，詳細的聊天、記帳與資訊將會收錄於此。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-surface border border-border rounded-2xl p-4 shadow-minimal hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold bg-background border border-border text-secondary px-2 py-0.5 rounded-md">
                    {room.category}
                  </span>
                  <h3 className="text-base font-bold text-primary mt-1.5">{room.title}</h3>
                </div>
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <Calendar size={12} /> {room.endedAt}
                </span>
              </div>

              {/* 統計指標 */}
              <div className="grid grid-cols-2 gap-2 my-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Users size={14} className="text-muted" />
                  <span>{room.memberCount} 人參與</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Receipt size={14} className="text-muted" />
                  <span>總支出 ${room.totalExpense}</span>
                </div>
              </div>

              {/* 卡片頁腳點擊進入詳情 */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                <div className="flex items-center gap-1 text-muted">
                  <Star size={12} className={room.userRated ? "text-primary fill-primary" : "text-muted"} />
                  <span>{room.userRated ? "已評分" : "未評分"}</span>
                </div>
                <Link
                  href={`/room/${room.id}`}
                  className="flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  查看歸檔內容 <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}