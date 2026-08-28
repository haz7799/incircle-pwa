"use client";

import { useState, useEffect, use } from "react";
import { 
  MessageSquare, 
  Calendar, 
  Receipt, 
  FileText, 
  BarChart2, 
  ArrowLeft, 
  Settings, 
  LogOut, 
  X, 
  Crown, 
  UserCheck 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove, deleteDoc, getDoc } from "firebase/firestore";

import ChatBox from "@/components/room/ChatBox";
import BillSettlement from "@/components/room/BillSettlement";
import ScheduleSlotMatcher from "@/components/room/ScheduleSlotMatcher";
import VoteDecision from "@/components/room/VoteDecision";
import SharedMemo from "@/components/room/SharedMemo";
import InviteModal from "@/components/room/InviteModal";

interface MemberInfo {
  uid: string;
  displayName: string;
}

interface RoomData {
  title: string;
  maxMembers: number;
  paymentType: string;
  members: string[];
  hostId: string;
  hostName?: string;
}

export default function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"chat" | "memo" | "vote" | "schedule" | "bill">("chat");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [memberList, setMemberList] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 彈窗 State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 修改表單 State
  const [editTitle, setEditTitle] = useState("");
  const [editMaxMembers, setEditMaxMembers] = useState("4");
  const [editPaymentType, setEditPaymentType] = useState("AA制 (平分)");
  const [selectedNewHostId, setSelectedNewHostId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 即時監聽房間資料
  useEffect(() => {
    const docRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RoomData;
        setRoom(data);
        setEditTitle(data.title || "");
        setEditMaxMembers(data.maxMembers?.toString() || "4");
        setEditPaymentType(data.paymentType || "AA制 (平分)");

        // 讀取房間成員名稱名單 (供房主轉讓選擇)
        const fetchedMembers: MemberInfo[] = [];
        for (const memberUid of data.members || []) {
          const userDoc = await getDoc(doc(db, "users", memberUid));
          if (userDoc.exists()) {
            fetchedMembers.push({
              uid: memberUid,
              displayName: userDoc.data().displayName || "局內搭子",
            });
          } else {
            fetchedMembers.push({
              uid: memberUid,
              displayName: "局內搭子",
            });
          }
        }
        setMemberList(fetchedMembers);
      } else {
        alert("房間不存在或已被刪除");
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, router]);

  // 修改房間資料與轉讓房主
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      const roomRef = doc(db, "rooms", roomId);
      const updateData: Partial<RoomData> = {
        title: editTitle.trim(),
        maxMembers: parseInt(editMaxMembers) || 4,
        paymentType: editPaymentType,
      };

      // 若有選擇新的房主
      if (selectedNewHostId && selectedNewHostId !== room?.hostId) {
        const newHost = memberList.find((m) => m.uid === selectedNewHostId);
        if (newHost) {
          updateData.hostId = newHost.uid;
          updateData.hostName = newHost.displayName;
        }
      }

      await updateDoc(roomRef, updateData);
      setSelectedNewHostId("");
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("更新房間失敗:", err);
      alert("修改失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  // 退出房間邏輯
  const handleLeaveRoom = async () => {
    if (!user || !room) return;
    if (!confirm("確定要退出這個房間嗎？")) return;

    try {
      const roomRef = doc(db, "rooms", roomId);
      
      // 若只剩一人，直接刪除房間
      if (room.members.length <= 1) {
        await deleteDoc(roomRef);
      } else {
        const remainingMembers = room.members.filter((id) => id !== user.uid);
        const updateObj: Record<string, any> = {
          members: arrayRemove(user.uid),
        };

        // 如果是房主退出且還有其他人，自動將房主轉讓給下一位成員
        if (room.hostId === user.uid && remainingMembers.length > 0) {
          const nextHostUid = remainingMembers[0];
          const nextHost = memberList.find((m) => m.uid === nextHostUid);
          updateObj.hostId = nextHostUid;
          updateObj.hostName = nextHost?.displayName || "局內搭子";
        }

        await updateDoc(roomRef, updateObj);
      }

      router.push("/");
    } catch (err) {
      console.error("退出房間失敗:", err);
      alert("退出失敗，請稍後再試。");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHost = user?.uid === room?.hostId;
  const otherMembers = memberList.filter((m) => m.uid !== user?.uid);

  const tabs = [
    { id: "chat", icon: MessageSquare, label: "聊天" },
    { id: "schedule", icon: Calendar, label: "空擋" },
    { id: "bill", icon: Receipt, label: "記帳" },
    { id: "vote", icon: BarChart2, label: "投票" },
    { id: "memo", icon: FileText, label: "記事" },
  ] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] pb-16">
      {/* 房間標題與頂部導覽列 */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-minimal mb-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 border border-border rounded-xl bg-background text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-primary">{room?.title}</h2>
              {isHost && (
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                  <Crown size={10} /> 房主
                </span>
              )}
            </div>
            <p className="text-[10px] text-secondary mt-0.5">
              {room?.members.length} / {room?.maxMembers} 人 · {room?.paymentType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 border border-border rounded-xl bg-background text-secondary hover:text-primary transition-colors"
            title="房間設定"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="text-xs bg-primary text-surface px-3 py-1.5 rounded-xl font-medium shadow-minimal active:scale-[0.98] transition-transform"
          >
            邀請搭子
          </button>
        </div>
      </div>

      {/* 功能頁籤切換 */}
      <div className="flex bg-surface border border-border rounded-xl p-1 mb-3 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${
                isActive ? "bg-background shadow-minimal text-primary font-bold" : "text-muted"
              }`}
            >
              <Icon size={16} className="mb-0.5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 動態內容渲染區塊 */}
      <div className="flex-1 overflow-hidden bg-surface rounded-2xl border border-border flex flex-col shadow-minimal">
        {activeTab === "chat" && <ChatBox roomId={roomId} />}
        {activeTab === "bill" && <BillSettlement roomId={roomId} />}
        {activeTab === "schedule" && <ScheduleSlotMatcher roomId={roomId} />}
        {activeTab === "vote" && <VoteDecision roomId={roomId} />}
        {activeTab === "memo" && <SharedMemo roomId={roomId} />}
      </div>

      {/* 房間邀請 Modal */}
      {isInviteOpen && (
        <InviteModal
          roomId={roomId}
          roomTitle={room?.title || "房間邀請"}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      {/* 房間設定/編輯與轉讓房主 Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-primary">房間設定與管理</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-primary">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-secondary">修改房間名稱</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-secondary">人數上限</label>
                <input
                  type="number"
                  min={room?.members.length || 2}
                  max="20"
                  value={editMaxMembers}
                  onChange={(e) => setEditMaxMembers(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-secondary">付錢方式</label>
                <select
                  value={editPaymentType}
                  onChange={(e) => setEditPaymentType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary mt-1"
                >
                  <option value="AA制 (平分)">AA制 (平分)</option>
                  <option value="發起人請客">發起人請客</option>
                  <option value="輪流請客">輪流請客</option>
                  <option value="現場協商">現場協商</option>
                </select>
              </div>

              {/* 房主專屬：轉讓房主權限 */}
              {isHost && otherMembers.length > 0 && (
                <div className="pt-2 border-t border-border space-y-1.5">
                  <label className="text-[10px] font-medium text-secondary flex items-center gap-1">
                    <Crown size={12} className="text-primary" /> 轉讓房主權限
                  </label>
                  <select
                    value={selectedNewHostId}
                    onChange={(e) => setSelectedNewHostId(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">保持當前房主身份</option>
                    {otherMembers.map((member) => (
                      <option key={member.uid} value={member.uid}>
                        轉讓給 {member.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSaving || !editTitle.trim()}
                  className="w-full py-2.5 text-xs font-bold text-surface bg-primary rounded-xl disabled:opacity-50"
                >
                  {isSaving ? "儲存中..." : "儲存修改"}
                </button>

                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="w-full py-2.5 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} /> 退出房間
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}