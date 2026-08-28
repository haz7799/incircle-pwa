"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function AuthGateway() {
  const [step, setStep] = useState<"invite" | "register">("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  
  // 註冊表單狀態 (包含必填欄位)
  const [formData, setFormData] = useState({
    email: "", password: "", nickname: "", country: "", age: "", purpose: "約飯"
  });

  const verifyInviteCode = async () => {
    try {
      // 假設 Firestore 中有 invite_codes 集合
      const codeRef = doc(db, "invite_codes", inviteCode);
      const codeSnap = await getDoc(codeRef);
      
      if (codeSnap.exists() && !codeSnap.data().isUsed) {
        setStep("register");
        setError("");
      } else {
        setError("邀請碼無效或已被使用");
      }
    } catch (err) {
      setError("驗證失敗，請稍後再試");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. 建立 Auth 帳號
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. 寫入 User Profile 至 Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        nickname: formData.nickname,
        country: formData.country,
        age: Number(formData.age),
        purpose: formData.purpose,
        rating: 5.00,
        meetupsCount: 0
      });
      
      // 3. 標記邀請碼已使用 (需搭配 Cloud Functions 或更新寫入)
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (step === "invite") {
    return (
      <div className="bg-surface p-6 rounded-xl border border-border shadow-minimal">
        <h2 className="text-xl font-bold text-primary mb-4">輸入邀請碼加入局內</h2>
        <input 
          type="text" 
          placeholder="請輸入邀請碼" 
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-full border border-border rounded-lg p-3 text-primary mb-4 focus:outline-none focus:border-primary uppercase"
        />
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <button onClick={verifyInviteCode} className="w-full bg-primary text-surface rounded-lg py-3 font-medium">
          驗證並繼續
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="bg-surface p-6 rounded-xl border border-border shadow-minimal flex flex-col gap-4">
      <h2 className="text-xl font-bold text-primary">建立個人檔案</h2>
      <input type="email" placeholder="Email" required className="border border-border rounded-lg p-3" onChange={e => setFormData({...formData, email: e.target.value})} />
      <input type="password" placeholder="密碼" required className="border border-border rounded-lg p-3" onChange={e => setFormData({...formData, password: e.target.value})} />
      <input type="text" placeholder="顯示暱稱" required className="border border-border rounded-lg p-3" onChange={e => setFormData({...formData, nickname: e.target.value})} />
      <div className="flex gap-2">
        <input type="text" placeholder="國家/地區" required className="border border-border rounded-lg p-3 w-1/2" onChange={e => setFormData({...formData, country: e.target.value})} />
        <input type="number" placeholder="年齡" required className="border border-border rounded-lg p-3 w-1/2" onChange={e => setFormData({...formData, age: e.target.value})} />
      </div>
      <select className="border border-border rounded-lg p-3 text-primary bg-surface" onChange={e => setFormData({...formData, purpose: e.target.value})}>
        <option value="約飯">約飯</option>
        <option value="city walk">City Walk</option>
        <option value="追星搭子">追星搭子</option>
        <option value="玩樂">玩樂</option>
        <option value="Girls Night">Girls Night</option>
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" className="w-full bg-primary text-surface rounded-lg py-3 font-medium mt-2">
        完成註冊
      </button>
    </form>
  );
}