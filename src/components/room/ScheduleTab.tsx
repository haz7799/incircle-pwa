"use client";

import { useMemo } from "react";
import { calculateCommonSlots, UserSchedule } from "@/lib/schedule";
import { Users, CheckCircle } from "lucide-react";

export default function ScheduleTab({ roomId, totalMembers = 4 }: { roomId: string, totalMembers?: number }) {
  // Mock Data: 實務上請透過 onSnapshot 監聽 Firebase 該房間的 schedules 子集合
  const mockSchedules: UserSchedule[] = [
    { userId: "u1", userName: "InCircle 用戶", selectedSlots: [1700000000000, 1700001800000] },
    { userId: "u2", userName: "搭子A", selectedSlots: [1700001800000, 1700003600000] },
    { userId: "u3", userName: "搭子B", selectedSlots: [1700001800000] },
  ];

  const optimalSlots = useMemo(() => {
    return calculateCommonSlots(mockSchedules, totalMembers).filter(slot => slot.matchRate >= 0.5);
  }, [mockSchedules, totalMembers]);

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  };

  return (
    <div className="flex flex-col h-full bg-surface p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-primary">最佳時段推薦</h3>
        <button className="text-xs bg-background border border-border text-primary px-3 py-1.5 rounded-lg font-medium">
          填寫我的空擋
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
        {optimalSlots.length === 0 ? (
          <p className="text-sm text-secondary text-center mt-10">尚無足夠的交集時段</p>
        ) : (
          optimalSlots.map((slot) => {
            const isPerfectMatch = slot.availableUsers.length === totalMembers;
            
            return (
              <div 
                key={slot.timestamp}
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                  isPerfectMatch 
                    ? "border-primary bg-primary text-surface" 
                    : "border-border bg-background text-primary"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">{formatTime(slot.timestamp)}</span>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <Users size={12} />
                    <span>{slot.availableUsers.length} / {totalMembers} 人可參與</span>
                  </div>
                </div>
                
                {isPerfectMatch && (
                  <div className="flex items-center gap-1 text-xs font-bold bg-surface/20 px-2 py-1 rounded">
                    <CheckCircle size={12} /> 全員一致
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}