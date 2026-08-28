"use client";

import { useState, useEffect } from "react";
import { 
  BarChart2, 
  Plus, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Vote, 
  Users 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

interface VoteOption {
  id: string;
  text: string;
  voters: string[]; // 投票者的 user.uid 陣列
}

interface Poll {
  id: string;
  title: string;
  options: VoteOption[];
  status: "active" | "closed";
}

export default function VoteDecision({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增投票 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [optionTexts, setOptionTexts] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 即時監聽 Firestore 中的投票話題
  useEffect(() => {
    const q = query(collection(db, "polls"), where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pollList: Poll[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Poll[];
      setPolls(pollList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 投票或取消投票
  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return;

    const poll = polls.find((p) => p.id === pollId);
    if (!poll || poll.status === "closed") return;

    // 重新計算每個選項的 voters 陣列
    const updatedOptions = poll.options.map((opt) => {
      const hasVotedThis = opt.voters.includes(user.uid);
      if (opt.id === optionId) {
        // 切換目前選項
        return {
          ...opt,
          voters: hasVotedThis
            ? opt.voters.filter((id) => id !== user.uid)
            : [...opt.voters, user.uid],
        };
      } else {
        // 移除在其他選項的投票（單選模式）
        return {
          ...opt,
          voters: opt.voters.filter((id) => id !== user.uid),
        };
      }
    });

    try {
      const pollRef = doc(db, "polls", pollId);
      await updateDoc(pollRef, { options: updatedOptions });
    } catch (err) {
      console.error("投票失敗:", err);
    }
  };

  // 新增投票選項欄位
  const handleAddOptionField = () => {
    if (optionTexts.length < 5) {
      setOptionTexts([...optionTexts, ""]);
    }
  };

  // 建立新投票話題
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pollTitle.trim()) return;

    const validOptions = optionTexts.filter((t) => t.trim().length > 0);
    if (validOptions.length < 2) {
      alert("請至少填寫 2 個有效的投票選項");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedOptions: VoteOption[] = validOptions.map((text, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: text.trim(),
        voters: [],
      }));

      await addDoc(collection(db, "polls"), {
        roomId,
        title: pollTitle.trim(),
        options: formattedOptions,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setPollTitle("");
      setOptionTexts(["", ""]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("發起投票失敗:", err);
      alert("建立失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        同步投票數據中...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full no-scrollbar">
      {/* 頂部發起投票按鈕卡片 */}
      <div className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between shadow-minimal">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface border border-border rounded-xl text-primary">
            <Vote size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary">組局決策投票</h3>
            <p className="text-[10px] text-muted">地點、餐廳或行程意見徵集</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-surface px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 shadow-minimal active:scale-[0.98] transition-transform"
        >
          <Plus size={14} /> 發起投票
        </button>
      </div>

      {/* 投票話題列表 */}
      {polls.length === 0 ? (
        <div className="bg-background border border-border rounded-2xl p-8 text-center text-xs text-muted">
          目前沒有正在進行的投票，點擊右上角發起第一個決策！
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce(
              (sum, opt) => sum + opt.voters.length,
              0
            );

            return (
              <div
                key={poll.id}
                className="bg-surface border border-border rounded-2xl p-4 space-y-3 shadow-minimal"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-bold text-primary">{poll.title}</h4>
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Users size={12} /> {totalVotes} 票
                  </span>
                </div>

                {/* 選項列表 */}
                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const isMyVote = user ? opt.voters.includes(user.uid) : false;
                    const percentage =
                      totalVotes > 0
                        ? Math.round((opt.voters.length / totalVotes) * 100)
                        : 0;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                          isMyVote
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        {/* 投票比例進度條背景 */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-300 pointer-events-none"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <span
                            className={`font-medium ${
                              isMyVote ? "text-primary font-bold" : "text-primary"
                            }`}
                          >
                            {opt.text}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-secondary font-mono">
                              {opt.voters.length} 票 ({percentage}%)
                            </span>
                            {isMyVote && (
                              <CheckCircle2 size={14} className="text-primary shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 發起投票 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-primary">發起新決策投票</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-secondary">
                  投票主題
                </label>
                <input
                  type="text"
                  placeholder="例：想吃的餐廳選哪家？"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium text-secondary">
                  投票選項 (至少 2 項)
                </label>
                {optionTexts.map((txt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`選項 ${idx + 1}`}
                    value={txt}
                    onChange={(e) => {
                      const updated = [...optionTexts];
                      updated[idx] = e.target.value;
                      setOptionTexts(updated);
                    }}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary"
                  />
                ))}

                {optionTexts.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-xs text-secondary hover:text-primary underline flex items-center gap-1 pt-1"
                  >
                    <Plus size={12} /> 新增選項
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-secondary bg-background rounded-xl border border-border"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !pollTitle.trim()}
                  className="flex-1 py-2 text-xs font-medium text-surface bg-primary rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "發布中..." : "發布投票"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}