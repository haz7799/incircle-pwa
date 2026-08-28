"use client";

import { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Star, 
  Users, 
  History, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  Key, 
  Copy, 
  Check 
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface UserProfileData {
  rating?: number;
  meetupsCount?: number;
  bio?: string;
  role?: string;
  personalInviteCode?: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileData>({
    rating: 5.0,
    meetupsCount: 0,
    bio: "這個搭子很懶，還沒填寫個人簡介。",
    role: "user",
    personalInviteCode: "",
  });
  const [isFetching, setIsFetching] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            rating: data.rating ?? 5.0,
            meetupsCount: data.meetupsCount ?? 0,
            bio: data.bio || "這個搭子很懶，還沒填寫個人簡介。",
            role: data.role || "user",
            personalInviteCode: data.personalInviteCode || "",
          });
        }
      } catch (err) {
        console.error("讀取用戶資料失敗:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  const handleCopyCode = async () => {
    if (!profile.personalInviteCode) return;
    try {
      await navigator.clipboard.writeText(profile.personalInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("複製失敗:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-24">
      {/* 頂部個人名片卡片 */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-minimal">
        <div className="flex items-center gap-4">
          {/* 大頭貼 */}
          <div className="relative w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={28} className="text-secondary" />
            )}
          </div>

          {/* 姓名與信譽徽章 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary truncate">
                {user.displayName || "局內搭子"}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 text-secondary hover:text-primary transition-colors border border-border rounded-xl bg-background"
                title="編輯個人資料"
              >
                <Edit3 size={16} />
              </button>
            </div>
            <p className="text-xs text-secondary truncate mt-0.5">
              {user.email}
            </p>

            {/* 信譽評分條 */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border">
                <Star size={12} className="text-primary fill-primary" />
                <span className="text-xs font-bold text-primary">
                  {isFetching ? "..." : profile.rating?.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted">
                已組局 {profile.meetupsCount} 次
              </span>
            </div>
          </div>
        </div>

        {/* 個人簡介 */}
        <p className="text-xs text-secondary mt-4 pt-3 border-t border-border leading-relaxed">
          {profile.bio}
        </p>

        {/* 我的專屬邀請碼卡片 */}
        {profile.personalInviteCode && (
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between bg-background rounded-xl p-3 border">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-primary" />
              <div>
                <p className="text-[10px] text-muted">我的專屬邀請碼</p>
                <p className="text-xs font-mono font-bold text-primary">{profile.personalInviteCode}</p>
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 bg-surface border border-border rounded-lg text-secondary hover:text-primary transition-colors flex items-center gap-1 text-[10px]"
            >
              {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
              <span>{copied ? "已複製" : "複製"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 功能選單區塊 (與截圖選項一致) */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-minimal">
        {/* 社交與好友 */}
        <Link
          href="/profile/friends"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-background rounded-xl text-primary border border-border">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">社交與好友</p>
              <p className="text-xs text-secondary mt-0.5">管理好友名單、待審批與黑名單</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </Link>

        {/* 歷史紀錄 */}
        <Link
          href="/profile/history"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-background rounded-xl text-primary border border-border">
              <History size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">歷史紀錄</p>
              <p className="text-xs text-secondary mt-0.5">查看過往參與過的房間與分帳</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </Link>

        {/* 帳號與安全 */}
        <Link
          href="/profile/security"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-background rounded-xl text-primary border border-border">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">帳號與安全</p>
              <p className="text-xs text-secondary mt-0.5">驗證邀請碼狀態與個人隱私</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </Link>

        {/* 管理員專屬入口 (依據角色動態顯示) */}
        {profile.role === "admin" && (
          <Link
            href="/admin/invite-codes"
            className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary text-surface rounded-xl">
                <Key size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">管理員控制台</p>
                <p className="text-xs text-secondary mt-0.5">發行與管理系統通用邀請碼</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        )}
      </div>

      {/* 登出按鈕 */}
      <button
        onClick={handleSignOut}
        className="w-full bg-surface border border-border text-red-500 py-3.5 px-4 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 shadow-minimal active:scale-[0.98] transition-transform"
      >
        <LogOut size={16} />
        登出帳號
      </button>

      {/* 編輯個人資料彈窗 */}
      {isEditModalOpen && (
        <EditProfileModal
          currentDisplayName={user.displayName || "局內搭子"}
          currentBio={profile.bio || ""}
          currentPhotoURL={user.photoURL}
          onClose={() => setIsEditModalOpen(false)}
          onSaveSuccess={(updatedName, updatedBio, updatedPhoto) => {
            setProfile((prev) => ({ ...prev, bio: updatedBio }));
          }}
        />
      )}
    </div>
  );
}