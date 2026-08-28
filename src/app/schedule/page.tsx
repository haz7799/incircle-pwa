"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

interface RoomScheduleItem {
  id: string;
  title: string;
  status: "active" | "completed";
  dateStr?: string;
  members: string[];
  maxMembers?: number;
  paymentType?: string;
}

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [rooms, setRooms] = useState<RoomScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 監聽當前使用者參與的所有房間
    const q = query(
      collection(db, "rooms"),
      where("members", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RoomScheduleItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          status: docSnap.data().status || "active",
          title: docSnap.data().title || "未命名組局",
          dateStr: docSnap.data().dateStr || "尚未定檔",
          members: docSnap.data().members || [],
          maxMembers: docSnap.data().maxMembers || 4,
          paymentType: docSnap.data().paymentType || "AA制",
        }));
        setRooms(list);
        setLoading(false);
      },
      (err) => {
        console.error("讀取行程失敗:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeRooms = rooms.filter((r) => r.status === "active");
  const completedRooms = rooms.filter((r) => r.status === "completed");
  const currentList = tab === "active" ? activeRooms : completedRooms;

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        同步組局行程中...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* 頁籤切換 */}
      <div className="flex gap-4 border-b border-border pb-2">
        <button
          onClick={() => setTab("active")}
          className={`pb-2 px-1 text-sm transition-colors ${
            tab === "active"
              ? "text-primary font-bold border-b-2 border-primary"
              : "text-muted font-medium hover:text-primary"
          }`}
        >
          進行中 ({activeRooms.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`pb-2 px-1 text-sm transition-colors ${
            tab === "completed"
              ? "text-primary font-bold border-b-2 border-primary"
              : "text-muted font-medium hover:text-primary"
          }`}
        >
          歷史紀錄 ({completedRooms.length})
        </button>
      </div>

      {/* 房間卡片列表 */}
      {currentList.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-xs text-muted">
          {tab === "active" ? "目前沒有進行中的約局行程" : "尚無歷史結算紀錄"}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between hover:border-primary/40 active:bg-background transition-colors shadow-minimal"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-primary text-sm">{room.title}</h3>
                <div className="flex items-center gap-3 text-xs text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {room.dateStr || "尚未定檔"}
                  </span>
                  {room.status === "completed" ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      <CheckCircle2 size={10} /> 已結算
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-primary text-surface px-2 py-0.5 rounded text-[10px] font-medium">
                      <Clock size={12} /> {room.members.length}/{room.maxMembers} 人進局
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="text-muted" size={20} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}