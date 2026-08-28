"use client";

import { useState, useRef } from "react";
import { X, Camera, User, Upload } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

interface EditProfileModalProps {
  currentDisplayName: string;
  currentBio: string;
  currentPhotoURL?: string | null;
  onClose: () => void;
  onSaveSuccess: (updatedName: string, updatedBio: string, updatedPhoto: string) => void;
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
  const [isSaving, setIsSaving] = useState(false);

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
      // 1. 更新 Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
        });
      }

      // 2. 更新 Firestore 中的使用者文件
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      });

      onSaveSuccess(displayName.trim(), bio.trim(), photoURL.trim());
      onClose();
    } catch (err) {
      console.error("更新個人資料失敗:", err);
      alert("儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
        
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">編輯個人資料</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* 頭像更換區塊 */}
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

          <div>
            <label className="font-bold text-primary block mb-1">個人簡介</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-primary focus:outline-none focus:border-primary resize-none"
            />
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
      </div>
    </div>
  );
}