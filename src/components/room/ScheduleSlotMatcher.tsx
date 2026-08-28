"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Sparkles, 
  Check 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

interface TimeSlot {
  id: string;
  dateLabel: string;
  timeLabel: string;
}

interface ScheduleData {
  slots: { [slotId: string]: string[] }; // slotId -> array of userIds
  confirmedSlotId?: string;
}

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: "sat_morn", dateLabel: "週六", timeLabel: "早局 (10:00 - 14:00)" },
  { id: "sat_aft", dateLabel: "週六", timeLabel: "午局 (14:00 - 18:00)" },
  { id: "sat_eve", dateLabel: "週六", timeLabel: "晚局 (18:00 - 22:00)" },
  { id: "sun_morn", dateLabel: "週日", timeLabel: "早局 (10:00 - 14:00)" },
  { id: "sun_aft", dateLabel: "週日", timeLabel: "午局 (14:00 - 18:00)" },
  { id: "sun_eve", dateLabel: "週日", timeLabel: "晚局 (18:00 - 22:00)" },
];

export default function ScheduleSlotMatcher({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<ScheduleData>({ slots: {} });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalMembers = 4;

  useEffect(() => {
    const docRef = doc(db, "schedules", roomId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data() as ScheduleData);
      } else {
        setDoc(docRef, { slots: {} });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const toggleSlot = async (slotId: string) => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    try {
      const currentUsers = schedule.slots[slotId] || [];
      const hasJoined = currentUsers.includes(user.uid);

      const newUsers = hasJoined
        ? currentUsers.filter((id) => id !== user.uid)
        : [...currentUsers, user.uid];

      const docRef = doc(db, "schedules", roomId);
      await updateDoc(docRef, {
        [`slots.${slotId}`]: newUsers,
      });
    } catch (err) {
      console.error("更新空擋失敗:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 明確標註傳回值型態，避免 TypeScript 將 bestSlot 誤判為 never
  const getBestSlot = (): { bestSlot: TimeSlot | null; count: number } => {
    let maxCount = 0;
    let bestSlot: TimeSlot | null = null;

    for (const slot of DEFAULT_SLOTS) {
      const count = (schedule.slots[slot.id] || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestSlot = slot;
      }
    }

    return { bestSlot, count: maxCount };
  };

  const { bestSlot, count: bestCount } = getBestSlot();

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        同步成員空擋中...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full no-scrollbar">
      {/* 最佳空擋卡片 */}
      <div className="bg-background border border-border rounded-2xl p-4 shadow-minimal">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-xs font-bold text-primary">最佳搭局推薦</h3>
        </div>

        {bestSlot && bestCount > 0 ? (
          <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-primary">
                  {bestSlot.dateLabel}
                </span>
                <span className="text-xs text-secondary">
                  {bestSlot.timeLabel}
                </span>
              </div>
              <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                <Users size={12} /> {bestCount} / {totalMembers} 人有空
              </p>
            </div>
            {bestCount === totalMembers && (
              <span className="text-[10px] bg-primary text-surface px-2 py-0.5 rounded-md font-semibold">
                全員有空
              </span>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-muted">
            點擊下方時段標記你的空擋，系統將自動比對共同時間。
          </div>
        )}
      </div>

      {/* 空擋選擇列表 */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <CalendarIcon size={14} /> 點選你的空閒時間
        </h4>

        <div className="grid grid-cols-1 gap-2">
          {DEFAULT_SLOTS.map((slot) => {
            const userList = schedule.slots[slot.id] || [];
            const isMySlot = user ? userList.includes(user.uid) : false;
            const count = userList.length;

            return (
              <button
                key={slot.id}
                onClick={() => toggleSlot(slot.id)}
                disabled={isUpdating}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isMySlot
                    ? "bg-primary text-surface border-primary shadow-minimal"
                    : "bg-surface text-primary border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isMySlot
                        ? "bg-surface border-surface text-primary"
                        : "border-border bg-background"
                    }`}
                  >
                    {isMySlot && <Check size={14} className="stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{slot.dateLabel}</span>
                      <span
                        className={`text-xs ${
                          isMySlot ? "text-surface/80" : "text-secondary"
                        }`}
                      >
                        {slot.timeLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium ${
                    isMySlot
                      ? "bg-surface/20 text-surface"
                      : "bg-background text-secondary border border-border"
                  }`}
                >
                  <Users size={12} />
                  <span>{count} 人</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}