"use client";

import { useState, useEffect } from "react";
import { 
  Receipt, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  X, 
  Wallet 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  paidByName: string;
}

interface Member {
  uid: string;
  name: string;
}

interface SettlementStep {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export default function BillSettlement({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增消費 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 讀取房間消費紀錄與成員名單
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. 讀取消費紀錄
      const expQuery = query(collection(db, "expenses"), where("roomId", "==", roomId));
      const expSnapshot = await getDocs(expQuery);
      const expList: Expense[] = expSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
      setExpenses(expList);

      // 2. 模擬/讀取成員名單 (當前用戶 + 預設成員)
      setMembers([
        { uid: user?.uid || "current", name: user?.displayName || "我" },
        { uid: "user_2", name: "阿傑" },
        { uid: "user_3", name: "小涵" },
      ]);
    } catch (err) {
      console.error("讀取帳目失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roomId, user]);

  // 新增一筆消費
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "expenses"), {
        roomId,
        title: title.trim(),
        amount: parseFloat(amount),
        paidBy: user.uid,
        paidByName: user.displayName || "局內搭子",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setAmount("");
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("新增帳目失敗:", err);
      alert("新增失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 核心演算法：計算均分與最簡轉帳路徑
  const calculateSettlement = () => {
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    if (members.length === 0) return { totalExpense: 0, settlements: [], balances: {} };

    const perPerson = totalExpense / members.length;
    const netBalances: { [uid: string]: { name: string; net: number } } = {};

    members.forEach((m) => {
      netBalances[m.uid] = { name: m.name, net: -perPerson };
    });

    expenses.forEach((e) => {
      if (netBalances[e.paidBy]) {
        netBalances[e.paidBy].net += e.amount;
      } else {
        netBalances[e.paidBy] = { name: e.paidByName, net: e.amount - perPerson };
      }
    });

    const debtors: { uid: string; name: string; amount: number }[] = [];
    const creditors: { uid: string; name: string; amount: number }[] = [];

    Object.entries(netBalances).forEach(([uid, data]) => {
      if (data.net < -0.01) {
        debtors.push({ uid, name: data.name, amount: Math.abs(data.net) });
      } else if (data.net > 0.01) {
        creditors.push({ uid, name: data.name, amount: data.net });
      }
    });

    const settlements: SettlementStep[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const payAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        fromId: debtor.uid,
        fromName: debtor.name,
        toId: creditor.uid,
        toName: creditor.name,
        amount: Math.round(payAmount * 100) / 100,
      });

      debtor.amount -= payAmount;
      creditor.amount -= payAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { totalExpense, settlements, balances: netBalances };
  };

  const { totalExpense, settlements, balances } = calculateSettlement();

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-secondary animate-pulse">
        計算帳目中...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full no-scrollbar">
      {/* 總覽摘要卡片 */}
      <div className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between shadow-minimal">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface border border-border rounded-xl text-primary">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted">本局總支出</p>
            <p className="text-xl font-extrabold text-primary">${totalExpense.toFixed(1)}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-surface px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 shadow-minimal active:scale-[0.98] transition-transform"
        >
          <Plus size={14} /> 記一筆
        </button>
      </div>

      {/* 最簡清帳結算方案 */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <CheckCircle2 size={14} /> 最簡結算路徑
        </h4>

        {settlements.length === 0 ? (
          <div className="bg-background border border-border rounded-xl p-4 text-center text-xs text-muted">
            {expenses.length === 0 ? "尚無支出紀錄" : "目前帳目已平衡，無需互相轉帳"}
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((step, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{step.fromName}</span>
                  <ArrowRight size={12} className="text-muted" />
                  <span className="font-bold text-primary">{step.toName}</span>
                </div>
                <span className="font-mono font-bold text-primary">${step.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 消費明細列表 */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <Receipt size={14} /> 消費明細 ({expenses.length})
        </h4>

        <div className="space-y-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-medium text-primary">{exp.title}</p>
                <p className="text-[10px] text-muted mt-0.5">由 {exp.paidByName} 先墊付</p>
              </div>
              <span className="font-mono font-bold text-primary">${exp.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 新增消費彈窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-primary">新增墊付支出</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-primary">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-secondary">消費項目</label>
                <input
                  type="text"
                  placeholder="例：晚餐壽喜燒、Uber 車資"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-secondary">金額 ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-secondary bg-background rounded-xl border border-border"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !amount}
                  className="flex-1 py-2 text-xs font-medium text-surface bg-primary rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "儲存中..." : "新增紀錄"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}