"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, User, Upload } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { calculateAge, calculateZodiac, MBTI_OPTIONS } from "@/lib/profileHelpers";

interface EditProfileModalProps {
  currentDisplayName: string;
  currentBio: string;
  currentPhotoURL?: string | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function EditProfileModal({
  currentDisplayName,
  currentBio,
  currentPhotoURL,
  onClose,
  onSaveSuccess,
}: EditProfileModalProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [bio, setBio] = useState(currentBio);
  const [photoURL, setPhotoURL] = useState(currentPhotoURL || "");
  const [interests, setInterests] = useState("");

  // 生日與隱私設定
  const [dob, setDob] = useState("");
  const [dobPrivacy, setDobPrivacy] = useState<"full" | "month_day" | "private">("full");

  // 歲數與星座隱私
  const [agePrivacy, setAgePrivacy] = useState(true);
  const [zodiacPrivacy, setZodiacPrivacy] = useState(true);

  // MBTI
  const [mbti, setMbti] = useState("INFJ");
  const [mbtiPrivacy, setMbtiPrivacy] = useState(true);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 讀取當前完整的個人資料
  useEffect(() => {
    async function loadCurrentData() {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setInterests((data.interests || []).join(", "));
          setDob(data.dob || "");
          setDobPrivacy(data.dobPrivacy || "full");
          setAgePrivacy(data.agePrivacy ?? true);
          setZodiacPrivacy(data.zodiacPrivacy ?? true);
          setMbti(data.mbti || "INFJ");
          setMbtiPrivacy(data.mbtiPrivacy ?? true);
        }
      } catch (err) {
        console.error("讀取詳細個人資料失敗:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadCurrentData();
  }, [user]);

  // 相片上載/拍攝壓縮
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhotoURL(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setIsSaving(true);
    try {
      // 1. 更新 Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
        });
      }

      // 自動重新計算歲數與星座
      const age = calculateAge(dob);
      const zodiac = calculateZodiac(dob);

      // 2. 更新 Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
        interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
        dob,
        dobPrivacy,
        age,
        agePrivacy,
        zodiac,
        zodiacPrivacy,
        mbti,
        mbtiPrivacy,
      });

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("更新個人資料失敗:", err);
      alert("儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  const age = calculateAge(dob);
  const zodiac = calculateZodiac(dob);

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">編輯個人資料與隱私</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {isLoadingData ? (
          <div className="py-8 text-center text-xs text-muted">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            載入資料中...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* 頭像變更 */}
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors group shadow-minimal"
              >
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={30} className="text-muted group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={20} className="text-surface" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-background border border-border rounded-xl text-[10px] font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1 shadow-minimal"
              >
                <Upload size={12} />
                <span>拍攝或選擇相片</span>
              </button>
            </div>

            {/* 暱稱 */}
            <div>
              <label className="font-bold text-primary block mb-1">暱稱 *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary"
              />
            </div>

            {/* 個人簡介 */}
            <div>
              <label className="font-bold text-primary block mb-1">個人簡介</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* 興趣標籤 */}
            <div>
              <label className="font-bold text-primary block mb-1">個人興趣標籤 (以逗號隔開)</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="例如：追星, 美食, 酒搭子"
                className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary"
              />
            </div>

            {/* 出生年月日與生日顯示權限 */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="font-bold text-primary block">出生年月日</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted text-[10px]">生日公開權限：</span>
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

            {/* 歲數與星座公開開關 */}
            {dob && (
              <div className="bg-background border border-border rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[10px]">計算歲數: <strong className="text-primary">{age}歲</strong></span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-secondary">
                    <input
                      type="checkbox"
                      checked={agePrivacy}
                      onChange={(e) => setAgePrivacy(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    公開歲數
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted text-[10px]">計算星座: <strong className="text-primary">{zodiac}</strong></span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-secondary">
                    <input
                      type="checkbox"
                      checked={zodiacPrivacy}
                      onChange={(e) => setZodiacPrivacy(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    公開星座
                  </label>
                </div>
              </div>
            )}

            {/* MBTI */}
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
                  公開 MBTI
                </label>
              </div>

              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary"
              >
                {MBTI_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-secondary bg-background border border-border rounded-xl font-bold"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving || !displayName.trim()}
                className="flex-1 py-2 text-surface bg-primary rounded-xl font-bold disabled:opacity-50"
              >
                {isSaving ? "儲存中..." : "儲存修改"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}