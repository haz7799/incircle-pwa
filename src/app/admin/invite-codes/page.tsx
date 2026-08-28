"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Copy, 
  Check, 
  Power, 
  Trash2, 
  ArrowLeft, 
  Key, 
  RefreshCw 
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";
import { generateInviteCode } from "@/lib/generateCode";

interface InviteCodeItem {
  id: string;
  code: string;
  isActive: boolean;
  role: "user" | "admin";
  ownerId?: string;
  createdAt?: {
    seconds: number;
  };
}

export default function AdminInviteCodesPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<InviteCodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增邀請码 State
  const [customCode, setCustomCode] = useState("");
  const [targetRole, setTargetRole] = useState<"user" | "admin">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. 驗證目前使用者是否為管理員
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
          await fetchInviteCodes();
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("驗證管理員身份失敗:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // 2. 讀取所有邀請碼
  const fetchInviteCodes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "inviteCodes"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const codeList: InviteCodeItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as InviteCodeItem[];
      setCodes(codeList);
    } catch (err) {
      console.error("讀取邀請碼失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. 快速產生亂數邀請碼至輸入框
  const handleGenerateRandom = () => {
    setCustomCode(`INC-${generateInviteCode(6)}`);
  };

  // 4. 新增邀請碼
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;

    setIsSubmitting(true);
    try {
      const formattedCode = customCode.toUpperCase().trim();
      
      const docRef = await addDoc(collection(db, "inviteCodes"), {
        code: formattedCode,
        isActive: true,
        role: targetRole,
        ownerId: user?.uid,
        createdAt: serverTimestamp(),
      });

      setCodes((prev) => [
        {
          id: docRef.id,
          code: formattedCode,
          isActive: true,
          role: targetRole,
          ownerId: user?.uid,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
        ...prev,
      ]);

      setCustomCode("");
    } catch (err) {
      console.error("建立邀請碼失敗:", err);
      alert("建立失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. 切換啟用/停用狀態
  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "inviteCodes", id), {
        isActive: !currentStatus,
      });
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
      );
    } catch (err) {
      console.error("更新狀態失敗:", err);
    }
  };

  // 6. 刪除邀請碼
  const handleDeleteCode = async (id: string) => {
    if (!confirm("確定要刪除這組邀請碼嗎？")) return;
    try {
      await deleteDoc(doc(db, "inviteCodes", id));
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("刪除失敗:", err);
    }
  };

  // 7. 複製邀請碼
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 非管理員訪問阻擋
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-lg font-bold text-primary">存取被拒絕</h2>
        <p className="text-xs text-secondary max-w-[240px]">
          此頁面僅限系統管理員存取。請確認您的帳號身份。
        </p>
        <Link
          href="/"
          className="bg-primary text-surface px-4 py-2 rounded-xl text-xs font-medium"
        >
          返回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* 頂部標題 */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/profile"
          className="p-2 border border-border rounded-xl bg-surface text-primary hover:bg-background transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">邀請碼管理控制台</h1>
          <p className="text-xs text-secondary mt-0.5">產生與管理多次使用邀請碼</p>
        </div>
      </div>

      {/* 新增邀請碼卡片 */}
      <form onSubmit={handleCreateCode} className="bg-surface border border-border rounded-2xl p-4 shadow-minimal space-y-3">
        <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <Key size={14} /> 發行新邀請碼
        </h3>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="例如: ADMIN888 或點擊隨機"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary uppercase font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateRandom}
            className="p-2 bg-background border border-border text-secondary rounded-xl hover:text-primary transition-colors shrink-0"
            title="隨機生成"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">賦予角色：</span>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as "user" | "admin")}
              className="bg-background border border-border rounded-lg text-xs text-primary px-2 py-1 focus:outline-none"
            >
              <option value="user">一般用戶 (User)</option>
              <option value="admin">管理員 (Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !customCode.trim()}
            className="bg-primary text-surface px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1 shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Plus size={14} /> 新增
          </button>
        </div>
      </form>

      {/* 邀請碼列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-primary">已建立列表 ({codes.length})</h3>
          <span className="text-[10px] text-muted">可多次重複使用</span>
        </div>

        {codes.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted">
            尚無邀請碼資料
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between shadow-minimal text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{item.code}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        item.role === "admin"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-background border border-border text-secondary"
                      }`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted">
                    {item.createdAt?.seconds
                      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                      : "即時建立"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(item.code, item.id)}
                    className="p-1.5 bg-background border border-border rounded-lg text-secondary hover:text-primary transition-colors"
                    title="複製"
                  >
                    {copiedId === item.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => toggleCodeStatus(item.id, item.isActive)}
                    className={`p-1.5 border rounded-lg transition-colors ${
                      item.isActive
                        ? "bg-primary text-surface border-primary"
                        : "bg-background text-muted border-border"
                    }`}
                    title={item.isActive ? "停用" : "啟用"}
                  >
                    <Power size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteCode(item.id)}
                    className="p-1.5 bg-background border border-border rounded-lg text-muted hover:text-red-500 transition-colors"
                    title="刪除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}