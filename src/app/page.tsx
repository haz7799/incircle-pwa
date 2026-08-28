"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight, Calendar, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

interface RoomItem {
  id: string;
  title: string;
  category?: string;
  paymentType?: string;
  members: string[];
  maxMembers: number;
  status: string;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 即時監聽屬於當前用戶參與的房間
    const q = query(
      collection(db, "rooms"),
      where("members", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList: RoomItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as RoomItem[];
      setRooms(roomList);
      setLoading(false);
    }, (err) => {
      console.error("讀取房間列表錯誤:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        讀取房間列表中...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* 頂部快速建房入口 */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-minimal flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary">同頻組局</h2>
          <p className="text-[10px] text-muted mt-0.5">發起新房間或快速加入搭子圈</p>
        </div>
        <Link
          href="/create"
          className="bg-primary text-surface px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-minimal active:scale-[0.98] transition-transform"
        >
          <Plus size={14} /> 開啟房間
        </Link>
      </div>

      {/* 進行中的房間列表 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-primary px-1">進行中 ({rooms.length})</h3>

        {rooms.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted space-y-2">
            <p>目前沒有參與中的房間</p>
            <p className="text-[10px]">點擊上方「開啟房間」建立第一個約局！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/room/${room.id}`}
                className="block bg-surface border border-border rounded-2xl p-4 shadow-minimal hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-primary">{room.title}</h4>
                  <ChevronRight size={16} className="text-muted" />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted mt-2">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {room.members.length} / {room.maxMembers} 人
                  </span>
                  <span>·</span>
                  <span>{room.paymentType || "AA制"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}