"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  User as UserIcon, 
  Star, 
  Sparkles, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Key, 
  Copy, 
  Check 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserProfileData {
  uid: string;
  displayName?: string;
  photoURL?: string;
  rating?: number;
  meetupsCount?: number;
  bio?: string;
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

export default function UserProfileModal({
  userId,
  onClose,
  onOpenChat,
}: {
  userId: string;
  onClose: () => void;
  onOpenChat?: (user: { uid: string; displayName: string; photoURL?: string }) => void;
}) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            uid: userId,
            displayName: data.displayName || "局內搭子",
            photoURL: data.photoURL || "",
            rating: data.rating ?? 5.0,
            meetupsCount: data.meetupsCount ?? 0,
            bio: data.bio || "這個搭子很懶，還沒填寫個人簡介。",
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
        console.error("讀取搭子名片失敗:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleCopyCode = async () => {
    if (!profile?.personalInviteCode) return;
    try {
      await navigator.clipboard.writeText(profile.personalInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("複製失敗:", err);
    }
  };

  // 尊重隱私設定格式化生日
  const renderFormattedDob = () => {
    if (!profile?.dob || profile.dobPrivacy === "private") return null;
    const [year, month, day] = profile.dob.split("-");
    if (profile.dobPrivacy === "month_day") {
      return `${month}月${day}日`;
    }
    return `${year}年${month}月${day}日`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface w-full max-w-sm rounded-2xl p-8 shadow-xl border border-border text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted">讀取搭子名片中...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const formattedDob = renderFormattedDob();

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* 頂部關閉按鈕 */}
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">搭子個人名片</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* 主卡片內容 */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            {/* 頭像 */}
            <div className="relative w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-minimal">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={28} className="text-secondary" />
              )}
            </div>

            {/* 名字與評分 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-primary truncate">{profile.displayName}</h4>
              
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border">
                  <Star size={12} className="text-primary fill-primary" />
                  <span className="text-xs font-bold text-primary">{profile.rating?.toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted">已組局 {profile.meetupsCount} 次</span>
              </div>
            </div>
          </div>

          {/* 屬性標籤 (MBTI, 星座, 歲數, 生日) */}
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
                <Heart size={10} /> 興趣標籤
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

          {/* 專屬邀請碼 */}
          {profile.personalInviteCode && (
            <div className="pt-2 border-t border-border flex items-center justify-between bg-background rounded-xl p-3 border">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-primary" />
                <div>
                  <p className="text-[10px] text-muted">專屬邀請碼</p>
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

          {/* 私訊按鈕 */}
          {onOpenChat && (
            <button
              onClick={() => {
                onClose();
                onOpenChat({
                  uid: profile.uid,
                  displayName: profile.displayName || "局內搭子",
                  photoURL: profile.photoURL,
                });
              }}
              className="w-full bg-primary text-surface py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-minimal active:scale-[0.98] transition-transform mt-2"
            >
              <MessageSquare size={16} />
              傳送私訊
            </button>
          )}
        </div>

      </div>
    </div>
  );
}