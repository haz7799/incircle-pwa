"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Mail, 
  Key, 
  UserCheck, 
  Copy, 
  Check, 
  LogOut, 
  Trash2, 
  Lock,
  AlertTriangle,
  X
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

interface SecurityProfileData {
  role?: string;
  inviteCodeUsed?: string | null;
  personalInviteCode?: string;
  createdAt?: {
    seconds: number;
  };
}

export default function SecuritySettingsPage() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<SecurityProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // 刪除帳號 Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchSecurityData() {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data() as SecurityProfileData);
        }
      } catch (err) {
        console.error("讀取帳號安全資訊失敗:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSecurityData();
  }, [user]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("登出失敗:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      // 1. 刪除 Firestore 中的使用者文件
      await deleteDoc(doc(db, "users", user.uid));
      // 2. 刪除 Firebase Auth 帳號
      await deleteUser(user);
    } catch (err) {
      console.error("刪除帳號失敗:", err);
      alert("刪除帳號失敗，可能需要重新登入後再試。");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-5 pb-24">
      {/* 頂部導覽 */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/profile"
          className="p-2 border border-border rounded-xl bg-surface text-primary hover:bg-background transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">帳號與安全</h1>
          <p className="text-xs text-secondary mt-0.5">管理個人身分驗證與邀請狀態</p>
        </div>
      </div>

      {/* 安全評估頂部狀態卡 */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-minimal flex items-center gap-3">
        <div className="p-3 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-primary">帳號防護正常</h3>
          <p className="text-[10px] text-muted mt-0.5">已綁定 Google 快速驗證與受管轄的組局權限</p>
        </div>
      </div>

      {/* 基本帳號資訊卡片 */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-minimal space-y-3">
        <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-border">
          <Mail size={14} /> 登入認證資訊
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-secondary">電子郵件</span>
            <span className="font-mono font-medium text-primary">{user.email}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-secondary">驗證方式</span>
            <span className="bg-background border border-border text-primary px-2 py-0.5 rounded-md font-medium text-[10px]">
              Google OAuth 2.0
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-secondary">用戶 ID (UID)</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-muted text-[10px] truncate max-w-[140px]">
                {user.uid}
              </span>
              <button
                onClick={() => handleCopy(user.uid, "uid")}
                className="p-1 hover:text-primary text-muted"
                title="複製 UID"
              >
                {copiedCode === "uid" ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 邀請碼與權限狀態 */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-minimal space-y-3">
        <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-border">
          <Key size={14} /> 邀請碼與權限狀態
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-secondary">當前角色權限</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              profileData?.role === "admin"
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}>
              {profileData?.role === "admin" ? "系統管理員 (Admin)" : "標準局內用戶 (User)"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-secondary">使用過的註冊邀請碼</span>
            <span className="font-mono text-primary font-bold">
              {profileData?.inviteCodeUsed || "無 (開放註冊/官方通路)"}
            </span>
          </div>

          {profileData?.personalInviteCode && (
            <div className="flex justify-between items-center">
              <span className="text-secondary">專屬邀請碼 (分發搭子)</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-primary">
                  {profileData.personalInviteCode}
                </span>
                <button
                  onClick={() => handleCopy(profileData.personalInviteCode!, "personal")}
                  className="p-1 hover:text-primary text-muted"
                >
                  {copiedCode === "personal" ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 危險區塊：帳號操作 */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-minimal space-y-3">
        <h3 className="text-xs font-bold text-red-500 flex items-center gap-1.5 pb-2 border-b border-border">
          <Lock size={14} /> 帳號管理操作
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full bg-background border border-border text-primary py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between hover:border-primary/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut size={14} /> 登出當前帳號
            </span>
            <span className="text-[10px] text-muted">清除本地登入憑證</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full bg-red-500/5 border border-red-500/20 text-red-500 py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between hover:bg-red-500/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={14} /> 註銷並刪除帳號
            </span>
            <span className="text-[10px] text-red-400">不可逆的操作</span>
          </button>
        </div>
      </div>

      {/* 刪除帳號二次確認 Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                <AlertTriangle size={16} /> 警告：註銷帳號
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-muted hover:text-primary">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              您確定要註銷並刪除《局內 InCircle》帳號嗎？刪除後將會同步清除個人簡介、評分與歷史紀錄，此操作無法復原。
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-medium text-secondary bg-background rounded-xl border border-border"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-medium text-surface bg-red-500 rounded-xl disabled:opacity-50"
              >
                {isDeleting ? "刪除中..." : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}