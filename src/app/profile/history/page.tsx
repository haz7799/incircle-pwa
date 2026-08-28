"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  History, 
  Calendar, 
  MapPin, 
  Users, 
  Receipt, 
  ChevronRight, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface RoomHistoryItem {
  id: string;
  title: string;
  location?: string;
  dateStr?: string;
  status: "active" | "completed";
  totalExpense?: number;
  membersCount?: number;
  createdAt?: {
    seconds: number;
  };
}

export default function RoomHistoryPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<RoomHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");

  useEffect(() => {
    async function fetchRoomHistory() {
      if (!user) return;
      setLoading(true);
      try {
        // 查詢當前用戶參與過的所有房間紀錄
        const q = query(
          collection(db, "rooms"),
          where("members", "array-contains", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const roomList: RoomHistoryItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "未命名組局",
            location: data.location || "未定地點",
            dateStr: data.dateStr || "待定時間",
            status: data.status || "active",
            totalExpense: data.totalExpense || 0,
            membersCount: (data.members || []).length || 1,
            createdAt: data.createdAt,
          };
        });

        setRooms(roomList);
      } catch (err) {
        console.error("讀取歷史紀錄失敗:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoomHistory();
  }, [user]);

  // 篩選列表
  const filteredRooms = rooms.filter((room) => {
    if (filter === "completed") return room.status === "completed";
    if (filter === "active") return room.status === "active";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* 頂部導覽 */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/profile"
          className="p-2 border border-border rounded-xl bg-surface text-primary hover:bg-background transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">歷史紀錄</h1>
          <p className="text-xs text-secondary mt-0.5">過往參與過的房間與結算帳單</p>
        </div>
      </div>

      {/* 篩選切換按鈕 */}
      <div className="flex bg-surface border border-border rounded-xl p-1 shadow-minimal">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            filter === "all"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          全部 ({rooms.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            filter === "active"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          進行中 ({rooms.filter((r) => r.status === "active").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            filter === "completed"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          已結算 ({rooms.filter((r) => r.status === "completed").length})
        </button>
      </div>

      {/* 歷史房間列表 */}
      {filteredRooms.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted space-y-2">
          <History size={28} className="mx-auto text-muted/60" />
          <p>尚無對應的組局歷史紀錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="block bg-surface border border-border rounded-2xl p-4 shadow-minimal hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between pb-2 border-b border-border/60">
                <div>
                  <h3 className="text-sm font-bold text-primary">{room.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-secondary mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {room.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {room.dateStr}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                    room.status === "completed"
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  {room.status === "completed" ? (
                    <>
                      <CheckCircle2 size={10} /> 已結算
                    </>
                  ) : (
                    <>
                      <Clock size={10} /> 進行中
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 text-xs">
                <div className="flex items-center gap-4 text-muted text-[10px]">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {room.membersCount} 人參與
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-primary">
                    <Receipt size={12} /> ${room.totalExpense?.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center text-secondary text-[10px] font-medium">
                  查看詳情 <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}