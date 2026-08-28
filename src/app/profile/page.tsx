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
  Edit3 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AuthLanding from "@/components/auth/AuthLanding";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface UserProfileData {
  rating?: number;
  meetupsCount?: number;
  bio?: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileData>({
    rating: 5.0,
    meetupsCount: 0,
    bio: "這個搭子很懶，還沒填寫個人簡介。"
  });
  const [isFetching, setIsFetching] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
            bio: data.bio || "這個搭子很懶，還沒填寫個人簡介。"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthLanding />;
  }

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
      </div>

      {/* 功能選單區塊 */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-minimal divider-y">
        {/* 社交管理 */}
        <button className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl text-primary">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">社交與好友</p>
              <p className="text-[10px] text-muted">管理好友名單、待審批與黑名單</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 歷史組局 */}
        <button className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl text-primary">
              <History size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">歷史紀錄</p>
              <p className="text-[10px] text-muted">查看過往參與過的房間與分帳</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 隱私與安全 */}
        <button className="w-full p-4 flex items-center justify-between text-left hover:bg-background transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl text-primary">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">帳號與安全</p>
              <p className="text-[10px] text-muted">驗證邀請碼狀態與個人隱私</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>
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
          onClose={() => setIsEditModalOpen(false)}
          onSaveSuccess={(updatedName, updatedBio) => {
            setProfile((prev) => ({ ...prev, bio: updatedBio }));
          }}
        />
      )}
    </div>
  );
}