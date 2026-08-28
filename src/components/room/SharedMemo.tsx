"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  X, 
  Pin, 
  Trash2, 
  User, 
  Clock 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

interface Memo {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt?: {
    seconds: number;
  };
}

export default function SharedMemo({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增記事 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 即時監聽 Firestore 中的記事內容
  useEffect(() => {
    const q = query(collection(db, "memos"), where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memoList: Memo[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Memo[];

      // 排序：釘選優先，其次依時間排序
      memoList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setMemos(memoList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 新增記事
  const handleCreateMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !memoTitle.trim() || !memoContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "memos"), {
        roomId,
        title: memoTitle.trim(),
        content: memoContent.trim(),
        authorId: user.uid,
        authorName: user.displayName || "局內搭子",
        isPinned: false,
        createdAt: serverTimestamp(),
      });

      setMemoTitle("");
      setMemoContent("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("建立記事失敗:", err);
      alert("建立失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切換釘選狀態
  const togglePin = async (memoId: string, currentPinned: boolean) => {
    try {
      const memoRef = doc(db, "memos", memoId);
      await updateDoc(memoRef, { isPinned: !currentPinned });
    } catch (err) {
      console.error("切換釘選失敗:", err);
    }
  };

  // 刪除記事
  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm("確定要刪除這筆記事嗎？")) return;
    try {
      await deleteDoc(doc(db, "memos", memoId));
    } catch (err) {
      console.error("刪除記事失敗:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        同步共享記事本中...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full no-scrollbar">
      {/* 頂部按鈕區 */}
      <div className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between shadow-minimal">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface border border-border rounded-xl text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary">共享記事與公告</h3>
            <p className="text-[10px] text-muted">共同記錄注意事項、行程與注意事項</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-surface px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 shadow-minimal active:scale-[0.98] transition-transform"
        >
          <Plus size={14} /> 新增記事
        </button>
      </div>

      {/* 記事列表 */}
      {memos.length === 0 ? (
        <div className="bg-background border border-border rounded-2xl p-8 text-center text-xs text-muted">
          目前尚無記事，點擊右上角紀錄第一條注意事項或行程資訊！
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={`bg-surface border rounded-2xl p-4 space-y-2 shadow-minimal transition-colors ${
                memo.isPinned ? "border-primary/60 bg-primary/[0.02]" : "border-border"
              }`}
            >
              {/* 卡片標題與操作按鈕 */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  {memo.isPinned && (
                    <Pin size={12} className="text-primary fill-primary shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-primary">{memo.title}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(memo.id, memo.isPinned)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      memo.isPinned
                        ? "bg-primary text-surface border-primary"
                        : "bg-background text-muted border-border hover:text-primary"
                    }`}
                  >
                    <Pin size={12} />
                  </button>

                  {user && (user.uid === memo.authorId) && (
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="p-1.5 bg-background text-muted border border-border hover:text-red-500 transition-colors rounded-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 記事內文 */}
              <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap pt-1">
                {memo.content}
              </p>

              {/* 頁腳作者資訊 */}
              <div className="flex items-center justify-between pt-2 text-[10px] text-muted border-t border-border/40">
                <span className="flex items-center gap-1">
                  <User size={12} /> {memo.authorName}
                </span>
                {memo.createdAt?.seconds && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(memo.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增記事 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-primary">新增共享記事</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMemo} className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-secondary">
                  標題
                </label>
                <input
                  type="text"
                  placeholder="例：行前注意事項、約定集合地點"
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-secondary">
                  內容
                </label>
                <textarea
                  placeholder="輸入詳細內容..."
                  rows={4}
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1 resize-none"
                />
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
                  disabled={isSubmitting || !memoTitle.trim() || !memoContent.trim()}
                  className="flex-1 py-2 text-xs font-medium text-surface bg-primary rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "建立中..." : "建立記事"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}