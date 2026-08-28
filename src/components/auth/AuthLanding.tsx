"use client";

import { useState } from "react";
import { Users, Calendar, Receipt, ArrowRight, CheckCircle2 } from "lucide-react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { generateInviteCode } from "@/lib/generateCode";

export default function AuthLanding() {
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  
  // 記錄已驗證通過的邀請碼資訊
  const [verifiedRole, setVerifiedRole] = useState<string | null>(null);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  // 驗證邀請碼邏輯 (僅驗證，不登入)
  const handleVerifyCode = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    
    const upperCode = inviteCode.toUpperCase().trim();
    
    // 1. 萬用管理員代碼
    if (upperCode === "ADMIN888" || upperCode === "INCIRCLE-ADMIN") {
      setVerifiedRole("admin");
      setVerifiedCode(upperCode);
      setLoading(false);
      return;
    }

    // 2. 查詢 Firestore 邀請碼 (支援管理員與用戶專屬碼)
    try {
      const q = query(
        collection(db, "inviteCodes"), 
        where("code", "==", upperCode), 
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // 取第一筆資料判斷是否帶有特定 role 屬性 (未設定則預設為 user)
        const codeData = snapshot.docs[0].data();
        setVerifiedRole(codeData.role || "user");
        setVerifiedCode(upperCode);
      } else {
        alert("邀請碼無效或已停用！請確認後再試。");
      }
    } catch (err) {
      console.error("驗證邀請碼錯誤:", err);
      alert("伺服器錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  // 觸發 Google 登入 / 註冊
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // 若是新用戶 (Firestore 無資料)
      if (!userSnap.exists()) {
        const batch = writeBatch(db);
        
        // 為新用戶產生專屬邀請碼
        const newPersonalCode = `INC-${generateInviteCode(6)}`;
        
        // 1. 建立使用者資料
        batch.set(userRef, {
          displayName: user.displayName || "局內搭子",
          email: user.email,
          photoURL: user.photoURL,
          role: verifiedRole || "user", // 使用已驗證的身份，若無則為 user (舊用戶直接點擊登入的情況)
          inviteCodeUsed: verifiedCode || null, // 記錄他用了誰的碼註冊
          personalInviteCode: newPersonalCode,  // 新用戶專屬的邀請碼
          rating: 5.0,
          meetupsCount: 0,
          bio: "這個搭子很懶，還沒填寫個人簡介。",
          createdAt: serverTimestamp(),
        });

        // 2. 將新產生的專屬邀請碼寫入 inviteCodes 集合，讓其他人可以使用
        const newCodeRef = doc(collection(db, "inviteCodes"));
        batch.set(newCodeRef, {
          code: newPersonalCode,
          isActive: true,
          ownerId: user.uid,
          role: "user", // 他邀請進來的人預設為 user
          createdAt: serverTimestamp()
        });

        await batch.commit();
      } else if (verifiedRole === "admin") {
        // 若是舊用戶，但這次輸入了管理員代碼，則升級權限
        await setDoc(userRef, { role: "admin" }, { merge: true });
      }
      
      // 成功後 AuthGuard 會自動偵測狀態並移除 AuthLanding
    } catch (error: any) {
      console.error("Google 登入失敗:", error);
      // 顯示詳細錯誤訊息，方便除錯 (例如網域未授權錯誤)
      alert(`登入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden fixed inset-0 z-[100]">
      
      {/* 頂部品牌 */}
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary text-surface rounded-2xl flex items-center justify-center font-bold text-2xl shadow-minimal mb-6">
          局
        </div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          局內 InCircle
        </h1>
        <p className="text-secondary text-sm mt-3 leading-relaxed">
          同頻約局，極簡體驗。<br />找到對的人，輕鬆組局與分帳。
        </p>
      </div>

      <div className="pb-10 space-y-4">
        {/* 階段 1：輸入邀請碼 */}
        {!verifiedCode && (
          <div className="space-y-3">
            {!showCodeInput ? (
              <>
                {/* 開放式登入 (可選，如果你希望完全封閉測試，可以隱藏這顆按鈕) */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-surface border border-border text-primary py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-3 shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
                  直接使用 Google 登入
                </button>
                <button
                  onClick={() => setShowCodeInput(true)}
                  className="w-full bg-primary text-surface py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-1 shadow-minimal active:scale-[0.98] transition-transform"
                >
                  我有邀請碼 <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <div className="bg-surface border border-border rounded-xl p-3 flex gap-2 shadow-minimal">
                <input
                  type="text"
                  placeholder="輸入邀請碼..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary uppercase font-mono"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={!inviteCode.trim() || loading}
                  className="bg-primary text-surface px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "驗證中" : "驗證"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 階段 2：驗證成功，顯示註冊按鈕 */}
        {verifiedCode && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 size={24} />
              <div>
                <p className="text-sm font-bold">邀請碼驗證成功！</p>
                <p className="text-xs opacity-80 mt-1">即將使用身份：{verifiedRole === "admin" ? "管理員" : "一般用戶"}</p>
              </div>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-primary text-surface py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-3 shadow-minimal active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
              {loading ? "註冊中..." : "綁定 Google 帳號完成註冊"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}