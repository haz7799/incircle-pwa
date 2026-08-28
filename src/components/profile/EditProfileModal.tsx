"use client";

import { useState, useRef } from "react";
import { X, Save, User, FileText, Camera } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";

interface EditProfileModalProps {
  currentDisplayName: string;
  currentBio: string;
  currentPhotoURL?: string | null;
  onClose: () => void;
  onSaveSuccess: (updatedName: string, updatedBio: string, updatedPhotoURL?: string) => void;
}

export default function EditProfileModal({
  currentDisplayName,
  currentBio,
  currentPhotoURL,
  onClose,
  onSaveSuccess,
}: EditProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [bio, setBio] = useState(currentBio);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(currentPhotoURL || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 選擇圖片並顯示預覽
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("圖片大小不能超過 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      let finalPhotoURL = currentPhotoURL || "";

      // 1. 若有選擇新頭像，上傳至 Firebase Storage
      if (selectedFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      // 2. 更新 Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: finalPhotoURL || null,
        });
        setUser({ ...auth.currentUser });
      }

      // 3. 更新 Firestore 中的 users/{uid} 資料
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          displayName: displayName.trim(),
          bio: bio.trim(),
          photoURL: finalPhotoURL,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      onSaveSuccess(displayName.trim(), bio.trim(), finalPhotoURL);
      onClose();
    } catch (error) {
      console.error("更新個人資料失敗:", error);
      alert("儲存失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-primary">編輯個人資料</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-primary transition-colors rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 大頭貼選擇與預覽區 */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden group">
              {previewURL ? (
                <img
                  src={previewURL}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-secondary" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-primary/40 text-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={20} />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-secondary underline hover:text-primary"
            >
              更換大頭貼
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary flex items-center gap-1.5">
              <User size={14} /> 顯示暱稱
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="請輸入暱稱"
              maxLength={20}
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary flex items-center gap-1.5">
              <FileText size={14} /> 個人簡介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介紹一下你自己..."
              maxLength={100}
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary focus:outline-none focus:border-primary resize-none transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-secondary bg-background rounded-xl border border-border"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="flex-1 py-2.5 text-xs font-medium text-surface bg-primary rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {isSubmitting ? "上傳中..." : "確認儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}