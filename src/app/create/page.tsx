"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { ShieldAlert, HelpCircle } from "lucide-react";

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [isPublic, setIsPublic] = useState(true);
  const [title, setTitle] = useState("");
  const [maxMembers, setMaxMembers] = useState("4");
  const [category, setCategory] = useState("飯局");
  const [paymentType, setPaymentType] = useState("AA制 (平分)");

  // 年齡限制
  const [hasAgeLimit, setHasAgeLimit] = useState(false);
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("35");

  // 問題審核限制
  const [requireApproval, setRequireApproval] = useState(false);
  const [joinQuestion, setJoinQuestion] = useState("");

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
      const roomRef = await addDoc(collection(db, "rooms"), {
        title: title.trim(),
        maxMembers: parseInt(maxMembers) || 4,
        category,
        paymentType,
        isPublic,
        minAge: hasAgeLimit ? parseInt(minAge) || 0 : null,
        maxAge: hasAgeLimit ? parseInt(maxAge) || 99 : null,
        requireApproval,
        joinQuestion: requireApproval ? joinQuestion.trim() : "",
        hostId: user.uid,
        hostName: user.displayName || "局內搭子",
        members: [user.uid],
        pendingRequests: [],
        status: "active",
        createdAt: serverTimestamp(),
      });

      router.push(`/room/${roomRef.id}`);
    } catch (err) {
      console.error("建立房間失敗:", err);
      alert("建立房間失敗，請再試一次。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
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

        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-primary block mb-1">房間名稱 *</label>
            <input
              type="text"
              placeholder="輸入標題 (如：週末壽喜燒)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-primary block mb-1">人數上限</label>
              <input
                type="number"
                min="2"
                max="20"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-primary block mb-1">目的</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
              >
                <option value="飯局">飯局</option>
                <option value="運動">運動</option>
                <option value="旅行">旅行</option>
                <option value="追星">追星</option>
                <option value="Girls Night">Girls Night</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-primary block mb-1">付錢方式</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            >
              <option value="AA制 (平分)">AA制 (平分)</option>
              <option value="AB制 (按各人花費支付)">AB制 (按各人花費支付)</option>
              <option value="房主請客">房主請客</option>
              <option value="再議">再議</option>
            </select>
          </div>

          {/* 年齡限制 */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-primary flex items-center gap-1">
                <ShieldAlert size={14} /> 設定年齡限制
              </label>
              <input
                type="checkbox"
                checked={hasAgeLimit}
                onChange={(e) => setHasAgeLimit(e.target.checked)}
                className="rounded text-primary focus:ring-0"
              />
            </div>

            {hasAgeLimit && (
              <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border">
                <input
                  type="number"
                  placeholder="最小年齡"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2 text-center"
                />
                <span className="text-muted">至</span>
                <input
                  type="number"
                  placeholder="最大年齡"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2 text-center"
                />
                <span className="text-muted shrink-0">歲</span>
              </div>
            )}
          </div>

          {/* 問答審核 */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-primary flex items-center gap-1">
                <HelpCircle size={14} /> 加入問答審核
              </label>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="rounded text-primary focus:ring-0"
              />
            </div>

            {requireApproval && (
              <input
                type="text"
                placeholder="輸入審核問題 (例如：最喜歡的一首歌是什麼？)"
                value={joinQuestion}
                onChange={(e) => setJoinQuestion(e.target.value)}
                required={requireApproval}
                className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
              />
            )}
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