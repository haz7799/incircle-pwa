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
  Check,
  Calendar,
  Sparkles,
  Heart
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface UserProfileData {
  displayName?: string;
  photoURL?: string;
  rating?: number;
  meetupsCount?: number;
  bio?: string;
  role?: string;
  personalInviteCode?: string;
  interests?: string[];
  dob?: string;
  dobPrivacy?: "full" | "month_day" | "private";
  age?: number;
  agePrivacy?: boolean;
  zodiac?: string;
  zodiacPrivacy?: boolean;
  mbti?: string;
  mbtiPrivacy?: boolean;
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

  // 讀取 Firestore 中的最新個人名片資訊
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          displayName: data.displayName || user.displayName || "局內搭子",
          photoURL: data.photoURL || user.photoURL || "",
          rating: data.rating ?? 5.0,
          meetupsCount: data.meetupsCount ?? 0,
          bio: data.bio || "這個搭子很懶，還沒填寫個人簡介。",
          role: data.role || "user",
          personalInviteCode: data.personalInviteCode || "",
          interests: data.interests || [],
          dob: data.dob || "",
          dobPrivacy: data.dobPrivacy || "full",
          age: data.age ?? 0,
          agePrivacy: data.agePrivacy ?? true,
          zodiac: data.zodiac || "",
          zodiacPrivacy: data.zodiacPrivacy ?? true,
          mbti: data.mbti || "",
          mbtiPrivacy: data.mbtiPrivacy ?? true,
        });
      }
    } catch (err) {
      console.error("讀取用戶資料失敗:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
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

  // 格式化生日顯示邏輯 (根據隱私設定)
  const renderFormattedDob = () => {
    if (!profile.dob || profile.dobPrivacy === "private") return null;
    const [year, month, day] = profile.dob.split("-");
    if (profile.dobPrivacy === "month_day") {
      return `${month}月${day}日`;
    }
    return `${year}年${month}月${day}日`;
  };

  if (!user) return null;

  const displayPhoto = profile.photoURL || user.photoURL;
  const formattedDob = renderFormattedDob();

  return (
    <div className="space-y-6 pb-24">
      {/* 頂部個人名片卡片 */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-minimal space-y-4">
        
        <div className="flex items-start gap-4">
          {/* 大頭貼 ICON */}
          <div className="relative w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-minimal">
            {displayPhoto ? (
              <img 
                src={displayPhoto} 
                alt={profile.displayName || "User"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={28} className="text-secondary" />
            )}
          </div>

          {/* 姓名與核心屬性 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary truncate">
                {profile.displayName || user.displayName || "局內搭子"}
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

            {/* 信譽評分與組局數 */}
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

        {/* 屬性標籤區塊 (MBTI, 星座, 歲數, 生日) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {profile.mbti && profile.mbtiPrivacy && (
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
              <Sparkles size={10} /> {profile.mbti}
            </span>
          )}

          {profile.zodiac && profile.zodiacPrivacy && (
            <span className="bg-background border border-border text-secondary px-2 py-0.5 rounded-md text-[10px] font-medium">
              {profile.zodiac}
            </span>
          )}

          {profile.agePrivacy && profile.age && profile.age > 0 ? (
            <span className="bg-background border border-border text-secondary px-2 py-0.5 rounded-md text-[10px] font-medium">
              {profile.age} 歲
            </span>
          ) : null}

          {formattedDob && (
            <span className="bg-background border border-border text-secondary px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
              <Calendar size={10} /> {formattedDob}
            </span>
          )}
        </div>

        {/* 興趣標籤 */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <p className="text-[10px] text-muted mb-1 flex items-center gap-1 font-medium">
              <Heart size={10} /> 個人興趣標籤
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-background border border-border text-primary px-2 py-0.5 rounded-lg text-[10px] font-medium"
                >
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 個人簡介 */}
        <p className="text-xs text-secondary pt-2 border-t border-border leading-relaxed">
          {profile.bio}
        </p>

        {/* 我的專屬邀請碼卡片 */}
        {profile.personalInviteCode && (
          <div className="mt-2 pt-3 border-t border-border flex items-center justify-between bg-background rounded-xl p-3 border">
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

      {/* 功能選單區塊 */}
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

        {/* 管理員專屬入口 */}
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
          currentPhotoURL={displayPhoto}
          onClose={() => setIsEditModalOpen(false)}
          onSaveSuccess={() => {
            fetchUserProfile(); // 儲存成功後即時刷頁面
          }}
        />
      )}
    </div>
  );
}