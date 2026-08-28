"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [isPublic, setIsPublic] = useState(true);
  const [title, setTitle] = useState("");
  const [maxMembers, setMaxMembers] = useState("4");
  const [category, setCategory] = useState("約飯");
  const [paymentType, setPaymentType] = useState("AA制 (平分)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("請先登入帳號");
      return;
    }
    if (!title.trim()) {
      alert("請輸入房間名稱");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 寫入 Firestore 房間資料
      const roomRef = await addDoc(collection(db, "rooms"), {
        title: title.trim(),
        maxMembers: parseInt(maxMembers) || 4,
        category,
        paymentType,
        isPublic,
        hostId: user.uid,
        hostName: user.displayName || "局內搭子",
        members: [user.uid], // 建房者預設加入成員
        status: "active",
        createdAt: serverTimestamp(),
      });

      // 2. 自動跳轉至剛建立的房間
      router.push(`/room/${roomRef.id}`);
    } catch (err) {
      console.error("建立房間失敗:", err);
      alert("建立房間失敗，請確認網路連線與資料庫權限。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-minimal space-y-4">
        {/* 公開/私密切換 */}
        <div className="flex bg-background p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isPublic ? "bg-surface text-primary shadow-minimal" : "text-muted"
            }`}
          >
            公開招募
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isPublic ? "bg-surface text-primary shadow-minimal" : "text-muted"
            }`}
          >
            私密房間
          </button>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary block mb-1">房間名稱</label>
            <input
              type="text"
              placeholder="輸入標題 (如：週末壽喜燒)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-primary block mb-1">人數上限</label>
              <input
                type="number"
                min="2"
                max="20"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-primary block mb-1">目的</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary focus:outline-none focus:border-primary"
              >
                <option value="約飯">約飯</option>
                <option value="運動">運動</option>
                <option value="旅遊">旅遊</option>
                <option value="展覽">展覽</option>
                <option value="桌遊">桌遊</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-primary block mb-1">付錢方式</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary focus:outline-none focus:border-primary"
            >
              <option value="AA制 (平分)">AA制 (平分)</option>
              <option value="發起人請客">發起人請客</option>
              <option value="輪流請客">輪流請客</option>
              <option value="現場協商">現場協商</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-primary text-surface py-3.5 rounded-xl font-bold text-xs shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "開啟中..." : isPublic ? "開啟公開房間" : "開啟私密房間"}
          </button>
        </form>
      </div>
    </div>
  );
}