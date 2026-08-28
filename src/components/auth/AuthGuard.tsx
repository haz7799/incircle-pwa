"use client";

import { useAuthStore } from "@/store/useAuthStore";
import AuthLanding from "@/components/auth/AuthLanding";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [checkingOnboarded, setCheckingOnboarded] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 當使用者狀態或路徑變更時重新檢查 onboarded 狀態
  useEffect(() => {
    async function checkUserOnboarding() {
      if (!user) {
        setIsOnboarded(false);
        setCheckingOnboarded(false);
        return;
      }

      setCheckingOnboarded(true);
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().onboarded === true) {
          setIsOnboarded(true);
        } else {
          setIsOnboarded(false);
        }
      } catch (err) {
        console.error("檢查用戶 onboarding 狀態失敗:", err);
      } finally {
        setCheckingOnboarded(false);
      }
    }

    if (user) {
      checkUserOnboarding();
    } else {
      setCheckingOnboarded(false);
    }
  }, [user, pathname]);

  // 重導邏輯：防止狀態未同步時的無限重導
  useEffect(() => {
    if (!mounted || loading || checkingOnboarded) return;

    if (user && !isOnboarded && pathname !== "/onboarding") {
      router.push("/onboarding");
    } else if (user && isOnboarded && pathname === "/onboarding") {
      router.push("/");
    }
  }, [user, mounted, loading, checkingOnboarded, isOnboarded, pathname, router]);

  if (!mounted || loading || (user && checkingOnboarded)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 未登入攔截
  if (!user) {
    return <AuthLanding />;
  }

  // 登入但未完成引導且不在 onboarding 頁面時暫停渲染內容
  if (!isOnboarded && pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
}