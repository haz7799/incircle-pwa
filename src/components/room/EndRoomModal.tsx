"use client";

import { useState } from "react";
import { Star, LogOut, Check } from "lucide-react";
import { submitUserRatings } from "@/lib/rating";

interface Member {
  userId: string;
  userName: string;
}

export default function EndRoomModal({ members, onClose }: { members: Member[], onClose: () => void }) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    // 預設給予 5 星好評
    members.reduce((acc, m) => ({ ...acc, [m.userId]: 5 }), {})
  );
  const [keepRoom, setKeepRoom] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (userId: string, score: number) => {
    setRatings(prev => ({ ...prev, [userId]: score }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = Object.entries(ratings).map(([targetUserId, score]) => ({
      targetUserId,
      score
    }));

    try {
      await submitUserRatings(payload);
      // 實務上在此處更新 Firestore 房間狀態為 ended，並依據 keepRoom 決定是否將自己移出 members 陣列
      alert("評分已提交，本次組局圓滿結束！");
      onClose();
    } catch (err) {
      alert("提交失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary">本次組局已結束</h2>
          <p className="text-sm text-secondary mt-1">請為參與的搭子留下評價</p>
        </div>

        {/* 評分列表 */}
        <div className="flex flex-col gap-4 max-h-60 overflow-y-auto no-scrollbar">
          {members.map(member => (
            <div key={member.userId} className="flex items-center justify-between p-3 border border-border rounded-xl bg-background">
              <span className="font-medium text-primary text-sm">{member.userName}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => handleStarClick(member.userId, star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star 
                      size={20} 
                      className={ratings[member.userId] >= star ? "text-primary fill-primary" : "text-muted"} 
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 離房選項 */}
        <button 
          onClick={() => setKeepRoom(!keepRoom)}
          className="flex items-center gap-3 p-3 border border-border rounded-xl active:bg-background transition-colors"
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center border ${keepRoom ? 'bg-primary border-primary' : 'border-border'}`}>
            {keepRoom && <Check size={14} className="text-surface" />}
          </div>
          <span className="text-sm font-medium text-primary">保留聊天室與記事紀錄</span>
        </button>

        {/* 動作按鈕 */}
        <div className="flex gap-3 mt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-3 font-medium text-secondary bg-background rounded-xl"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 font-medium text-surface bg-primary rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            {isSubmitting ? "處理中..." : "確認完局"}
          </button>
        </div>
      </div>
    </div>
  );
}