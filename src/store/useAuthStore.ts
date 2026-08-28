import { create } from 'zustand';

interface UserProfile {
  uid: string;
  nickname: string;
  country: string;
  age: number;
  purpose: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (status) => set({ isLoading: status }),
}));