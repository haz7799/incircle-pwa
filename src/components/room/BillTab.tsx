"use client";

import { useState, useMemo } from "react";
import { Receipt, DollarSign, User } from "lucide-react";
import { calculateSplit, PaymentMethod, Member } from "@/lib/billing";

export default function BillTab({ roomId }: { roomId: string }) {
  const [amountInput, setAmountInput] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("AA");

  // Mock Data: 實務上請從 Firestore 的 rooms/{roomId} 取得 members 陣列
  const mockMembers: Member[] = [
    { userId: "u1", userName: "InCircle 用戶", isHost: true },
    { userId: "u2", userName: "搭子A" },
    { userId: "u3", userName: "搭子B" },
    { userId: "u4", userName: "搭子C" },
  ];

  const totalAmount = parseFloat(amountInput) || 0;

  // 使用 useMemo 確保只有在金額或分配方式改變時才重新計算
  const splitResults = useMemo(() => {
    return calculateSplit(totalAmount, mockMembers, method);
  }, [totalAmount, method]);

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) return;
    
    // 實務上需將 splitResults 與 totalAmount 寫入 Firestore:
    // addDoc(collection(db, "rooms", roomId, "bills"), { ... })
    alert("帳單已建立！");
    setAmountInput("");
  };

  return (
    <div className="flex flex-col h-full bg-surface p-4">
      <form onSubmit={handleSaveBill} className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Receipt size={20} className="text-primary" />
          <h3 className="font-bold text-primary">新增帳單</h3>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-3.5 text-muted" size={18} />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="輸入總花費"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-primary focus:outline-none focus:border-primary text-lg font-bold"
            required
          />
        </div>

        <select 
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className="w-full border border-border rounded-xl p-3 bg-background text-primary focus:outline-none focus:border-primary"
        >
          <option value="AA">AA制 (均分)</option>
          <option value="HOST">發起人全付</option>
          <option value="CUSTOM">另議 (手動分配)</option>
        </select>

        <button 
          type="submit" 
          disabled={totalAmount <= 0}
          className="w-full bg-primary text-surface rounded-xl py-3 font-medium disabled:opacity-50 transition-opacity"
        >
          確認並發佈帳單
        </button>
      </form>

      {/* 分帳預覽結果 */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <h4 className="text-sm font-bold text-secondary mb-3">分帳明細預覽</h4>
        <div className="flex flex-col gap-2">
          {splitResults.map((result) => (
            <div 
              key={result.userId} 
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center border border-border">
                  <User size={14} className="text-secondary" />
                </div>
                <span className="text-sm font-medium text-primary">{result.userName}</span>
              </div>
              <span className="font-bold text-primary">
                ${result.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}