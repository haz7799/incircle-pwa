import { create } from "zustand";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // 於用戶端初始化時設定驗證狀態監聽器
  if (typeof window !== "undefined") {
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  }

  return {
    user: null,
    loading: true, // 初始設為載入中
    setUser: (user) => set({ user }),
  };
});