"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Camera, User, Upload } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { calculateAge, calculateZodiac, MBTI_OPTIONS } from "@/lib/profileHelpers";

export default function OnboardingPage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [interests, setInterests] = useState("");
  
  // 生日與隱私 (full: 年月日, month_day: 月日, private: 不公開)
  const [dob, setDob] = useState("");
  const [dobPrivacy, setDobPrivacy] = useState<"full" | "month_day" | "private">("full");

  // 歲數與隱私 (公開 / 不公開)
  const [agePrivacy, setAgePrivacy] = useState(true);

  // 星座與隱私 (公開 / 不公開)
  const [zodiacPrivacy, setZodiacPrivacy] = useState(true);

  // MBTI 與隱私
  const [mbti, setMbti] = useState("INFJ");
  const [mbtiPrivacy, setMbtiPrivacy] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const age = calculateAge(dob);
  const zodiac = calculateZodiac(dob);

  // 處理相片選擇 / 拍攝與自動壓縮
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // 壓縮為高品質 JPEG Data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhotoURL(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      alert("請輸入用戶名稱");
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          displayName: displayName.trim(),
          photoURL: photoURL.trim() || user.photoURL || "",
          interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
          dob,
          dobPrivacy,
          age,
          agePrivacy,
          zodiac,
          zodiacPrivacy,
          mbti,
          mbtiPrivacy,
          onboarded: true, // 標記已完成引導
        },
        { merge: true }
      );

      // 使用 window.location.href 重整導向首頁
      window.location.href = "/";
    } catch (err) {
      console.error("保存個人資料失敗:", err);
      alert("設定失敗，請稍後再試。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20 max-w-md mx-auto">
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-minimal space-y-5">
        
        {/* 標題頭部 */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary text-surface rounded-2xl mx-auto flex items-center justify-center font-bold text-xl shadow-minimal">
            局
          </div>
          <h1 className="text-xl font-bold text-primary">完善個人名片</h1>
          <p className="text-xs text-secondary leading-relaxed">
            填寫個人搭子資訊，精準匹配同頻話題夥伴！
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 頭像選擇/拍攝區塊 */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors group shadow-minimal"
            >
              {photoURL ? (
                <img src={photoURL} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-muted group-hover:text-primary transition-colors" />
              )}

              {/* 拍攝/選擇圖示 Overly */}
              <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={22} className="text-surface" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-[11px] font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1.5 shadow-minimal"
            >
              <Upload size={13} />
              <span>拍攝或從相簿選擇頭像</span>
            </button>
          </div>

          {/* 用戶名 */}
          <div>
            <label className="font-bold text-primary block mb-1">用戶名稱 *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例如：阿杰 / Alex"
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* 興趣標籤 */}
          <div>
            <label className="font-bold text-primary block mb-1">興趣標籤 (以逗號隔開)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="例如：露營, 美食, 演唱會, 健身"
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* 出生年月日與隱私設定 */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="font-bold text-primary block">出生年月日</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-muted text-[10px]">生日公開範圍：</span>
              <select
                value={dobPrivacy}
                onChange={(e) => setDobPrivacy(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-2 py-1 text-primary text-[11px]"
              >
                <option value="full">公開完整年月日</option>
                <option value="month_day">僅公開月日</option>
                <option value="private">不公開生日</option>
              </select>
            </div>
          </div>

          {/* 自動計算歲數與星座展示 */}
          {dob && (
            <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted text-[10px]">自動計算歲數：</span>
                  <span className="font-bold text-primary ml-1">{age} 歲</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-secondary">
                  <input
                    type="checkbox"
                    checked={agePrivacy}
                    onChange={(e) => setAgePrivacy(e.target.checked)}
                    className="rounded text-primary focus:ring-0"
                  />
                  公開顯示歲數
                </label>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <div>
                  <span className="text-muted text-[10px]">自動計算星座：</span>
                  <span className="font-bold text-primary ml-1">{zodiac}</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-secondary">
                  <input
                    type="checkbox"
                    checked={zodiacPrivacy}
                    onChange={(e) => setZodiacPrivacy(e.target.checked)}
                    className="rounded text-primary focus:ring-0"
                  />
                  公開顯示星座
                </label>
              </div>
            </div>
          )}

          {/* MBTI 人格類型 */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-bold text-primary">MBTI 人格類型</label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-secondary">
                <input
                  type="checkbox"
                  checked={mbtiPrivacy}
                  onChange={(e) => setMbtiPrivacy(e.target.checked)}
                  className="rounded text-primary focus:ring-0"
                />
                公開顯示 MBTI
              </label>
            </div>

            <select
              value={mbti}
              onChange={(e) => setMbti(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-primary"
            >
              {MBTI_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !displayName.trim()}
            className="w-full bg-primary text-surface py-3.5 rounded-xl font-bold text-xs shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50 mt-4 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? "保存中..." : "完成並進入局內"}
          </button>
        </form>
      </div>
    </div>
  );
}