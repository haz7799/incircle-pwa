"use client";

import { useState } from "react";
import { 
  Users, 
  Calendar, 
  Receipt, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2 
} from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function AuthLanding() {
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  // 觸發 Google 快捷登入 / 註冊
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // 登入成功後，Firebase Auth 監聽器會自動重定向至首頁
    } catch (error) {
      console.error("Google 登入失敗:", error);
      alert("登入失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      
      {/* 頂部品牌宣示 */}
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary text-surface rounded-2xl flex items-center justify-center font-bold text-2xl shadow-minimal mb-6">
          局
        </div>
        <span className="text-xs font-semibold tracking-widest text-muted uppercase mb-2">
          InCircle PWA
        </span>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          局內 InCircle
        </h1>
        <p className="text-secondary text-sm mt-3 max-w-[260px] leading-relaxed">
          同頻約局，極簡體驗。<br />找到對的人，輕鬆組局與分帳。
        </p>
      </div>

      {/* 核心功能亮點介紹 */}
      <div className="my-8 space-y-4">
        <div className="bg-surface p-4 rounded-2xl border border-border flex items-start gap-3 shadow-minimal">
          <div className="p-2.5 bg-background rounded-xl text-primary shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">同頻搭子匹配</h3>
            <p className="text-xs text-secondary mt-0.5">即時發起或加入聚會，拒絕無效社交。</p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border flex items-start gap-3 shadow-minimal">
          <div className="p-2.5 bg-background rounded-xl text-primary shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">共同空擋比對</h3>
            <p className="text-xs text-secondary mt-0.5">一鍵排查所有人空閒時間，告別反复問詢。</p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border flex items-start gap-3 shadow-minimal">
          <div className="p-2.5 bg-background rounded-xl text-primary shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">公平 AA 自動分帳</h3>
            <p className="text-xs text-secondary mt-0.5">透明化賬目追蹤，一鍵計算清帳最簡路徑。</p>
          </div>
        </div>
      </div>

      {/* 登入與引導操作區 */}
      <div className="pb-6 space-y-3">
        {/* Google 一鍵登入 (主按鈕) */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-primary text-surface py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-3 shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? "處理中..." : "使用 Google 帳號繼續"}
        </button>

        {/* 邀請碼模式折疊區塊 */}
        {!showCodeInput ? (
          <button
            onClick={() => setShowCodeInput(true)}
            className="w-full bg-surface border border-border text-secondary py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-1 hover:text-primary transition-colors"
          >
            我有邀請碼 <ArrowRight size={14} />
          </button>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-3 flex gap-2">
            <input
              type="text"
              placeholder="輸入邀請碼"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-primary uppercase"
            />
            <button
              onClick={handleGoogleSignIn}
              disabled={!inviteCode.trim() || loading}
              className="bg-primary text-surface px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              驗證
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted text-center mt-4">
          繼續即代表您同意《局內服務條款》與《隱私權政策》
        </p>
      </div>

    </div>
  );
}