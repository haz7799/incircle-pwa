"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  ShieldOff, 
  Search, 
  Check, 
  X, 
  UserX, 
  Clock, 
  UserCheck, 
  MessageSquare,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import DirectMessageModal from "@/components/chat/DirectMessageModal";
import UserProfileModal from "@/components/profile/UserProfileModal";

interface FriendUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  mbti?: string;
  zodiac?: string;
  personalInviteCode?: string;
}

export default function FriendsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "blocked">("friends");
  
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [blocked, setBlocked] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 彈窗 Modal 狀態
  const [chatFriend, setChatFriend] = useState<FriendUser | null>(null);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);

  // 搜尋與新增好友 Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQueryInput, setSearchQueryInput] = useState("");
  const [searchResult, setSearchResult] = useState<FriendUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // 讀取好友相關資料
  const fetchFriendsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const friendIds: string[] = data.friends || [];
        const requestIds: string[] = data.friendRequests || [];
        const blockedIds: string[] = data.blockedUsers || [];

        const fetchUserList = async (ids: string[]) => {
          if (ids.length === 0) return [];
          const list: FriendUser[] = [];
          for (const id of ids) {
            const uDoc = await getDoc(doc(db, "users", id));
            if (uDoc.exists()) {
              list.push({ uid: uDoc.id, ...uDoc.data() } as FriendUser);
            }
          }
          return list;
        };

        const [friendsData, requestsData, blockedData] = await Promise.all([
          fetchUserList(friendIds),
          fetchUserList(requestIds),
          fetchUserList(blockedIds),
        ]);

        setFriends(friendsData);
        setRequests(requestsData);
        setBlocked(blockedData);
      }
    } catch (err) {
      console.error("讀取好友名單失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [user]);

  // 搜尋新好友
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQueryInput.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    setRequestSent(false);

    try {
      const q = query(
        collection(db, "users"),
        where("personalInviteCode", "==", searchQueryInput.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        if (docSnap.id !== user?.uid) {
          setSearchResult({ uid: docSnap.id, ...docSnap.data() } as FriendUser);
        } else {
          alert("無法將自己新增為好友");
        }
      } else {
        alert("找不到對應專屬邀請碼的用戶");
      }
    } catch (err) {
      console.error("搜尋好友失敗:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // 發送好友申請
  const handleSendRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      const targetUserRef = doc(db, "users", targetUid);
      await updateDoc(targetUserRef, {
        friendRequests: arrayUnion(user.uid),
      });
      setRequestSent(true);
    } catch (err) {
      console.error("發送邀請失敗:", err);
    }
  };

  // 同意好友申請
  const handleAcceptRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      const currentUserRef = doc(db, "users", user.uid);
      const targetUserRef = doc(db, "users", targetUid);

      await updateDoc(currentUserRef, {
        friendRequests: arrayRemove(targetUid),
        friends: arrayUnion(targetUid),
      });
      await updateDoc(targetUserRef, {
        friends: arrayUnion(user.uid),
      });

      fetchFriendsData();
    } catch (err) {
      console.error("接受好友失敗:", err);
    }
  };

  // 拒絕好友申請
  const handleRejectRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        friendRequests: arrayRemove(targetUid),
      });
      fetchFriendsData();
    } catch (err) {
      console.error("拒絕邀請失敗:", err);
    }
  };

  // 移至黑名單
  const handleBlockUser = async (targetUid: string) => {
    if (!user || !confirm("確定要將此用戶加入黑名單嗎？")) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        friends: arrayRemove(targetUid),
        blockedUsers: arrayUnion(targetUid),
      });
      fetchFriendsData();
    } catch (err) {
      console.error("封鎖用戶失敗:", err);
    }
  };

  // 解除黑名單
  const handleUnblockUser = async (targetUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        blockedUsers: arrayRemove(targetUid),
      });
      fetchFriendsData();
    } catch (err) {
      console.error("解除封鎖失敗:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* 頂部導覽列與新增按鈕 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 border border-border rounded-xl bg-surface text-primary hover:bg-background transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">社交與好友</h1>
            <p className="text-xs text-secondary mt-0.5">組局搭子圈與名片互動</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2.5 bg-primary text-surface rounded-xl flex items-center gap-1 text-xs font-medium shadow-minimal active:scale-[0.98] transition-transform"
        >
          <UserPlus size={16} />
          <span>加搭子</span>
        </button>
      </div>

      {/* 頁籤切換 */}
      <div className="flex bg-surface border border-border rounded-xl p-1 shadow-minimal">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "friends"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          <Users size={14} />
          <span>好友 ({friends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === "requests"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          <Clock size={14} />
          <span>待審批 ({requests.length})</span>
          {requests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-3" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("blocked")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "blocked"
              ? "bg-background text-primary font-bold shadow-minimal"
              : "text-muted"
          }`}
        >
          <ShieldOff size={14} />
          <span>黑名單 ({blocked.length})</span>
        </button>
      </div>

      {/* 1. 好友列表 */}
      {activeTab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted">
              目前尚無好友搭子，點擊右上角新增第一個搭子！
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.uid}
                className="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between shadow-minimal hover:border-primary/40 transition-colors"
              >
                <div
                  onClick={() => setSelectedProfileUid(friend.uid)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-secondary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-primary truncate">{friend.displayName}</h4>
                      {friend.mbti && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold shrink-0">
                          {friend.mbti}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted truncate mt-0.5">
                      {friend.bio || "點擊查看詳細搭子名片"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChatFriend(friend)}
                    className="p-2 text-primary hover:bg-background border border-border rounded-xl transition-colors flex items-center gap-1 text-xs"
                    title="傳送私訊"
                  >
                    <MessageSquare size={14} />
                    <span>私訊</span>
                  </button>
                  <button
                    onClick={() => handleBlockUser(friend.uid)}
                    className="p-2 text-muted hover:text-red-500 rounded-xl hover:bg-background transition-colors"
                    title="加入黑名單"
                  >
                    <UserX size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. 待審批請求列表 */}
      {activeTab === "requests" && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted">
              目前沒有待處理的好友申請
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.uid}
                className="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between shadow-minimal"
              >
                <div
                  onClick={() => setSelectedProfileUid(req.uid)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {req.photoURL ? (
                      <img src={req.photoURL} alt={req.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-secondary" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">{req.displayName}</h4>
                    <p className="text-[10px] text-muted mt-0.5">請求加入你的搭子圈 · 點擊名片</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.uid)}
                    className="p-2 bg-primary text-surface rounded-xl hover:opacity-90 transition-opacity"
                    title="接受"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.uid)}
                    className="p-2 bg-background border border-border text-muted hover:text-primary rounded-xl transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. 黑名單列表 */}
      {activeTab === "blocked" && (
        <div className="space-y-2">
          {blocked.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-muted">
              黑名單為空
            </div>
          ) : (
            blocked.map((b) => (
              <div
                key={b.uid}
                className="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between shadow-minimal"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {b.photoURL ? (
                      <img src={b.photoURL} alt={b.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-secondary" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">{b.displayName}</h4>
                    <p className="text-[10px] text-red-400 mt-0.5">已封鎖</p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblockUser(b.uid)}
                  className="px-3 py-1.5 bg-background border border-border text-secondary text-xs rounded-xl hover:text-primary transition-colors"
                >
                  解除封鎖
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 好友名片 Modal */}
      {selectedProfileUid && (
        <UserProfileModal
          userId={selectedProfileUid}
          onClose={() => setSelectedProfileUid(null)}
          onOpenChat={(targetUser) => setChatFriend(targetUser as FriendUser)}
        />
      )}

      {/* 私訊對話 Modal */}
      {chatFriend && (
        <DirectMessageModal
          friend={chatFriend}
          onClose={() => setChatFriend(null)}
        />
      )}

      {/* 新增好友 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-primary">新增同頻搭子</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSearchResult(null);
                  setSearchQueryInput("");
                }}
                className="text-muted hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSearchUser} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="輸入專屬邀請碼 (例: INC-ABC123)"
                  value={searchQueryInput}
                  onChange={(e) => setSearchQueryInput(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary uppercase font-mono"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQueryInput.trim()}
                  className="bg-primary text-surface px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
                >
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* 搜尋結果 */}
            {searchResult && (
              <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                <div
                  onClick={() => setSelectedProfileUid(searchResult.uid)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {searchResult.photoURL ? (
                      <img src={searchResult.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={14} className="text-secondary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary truncate">{searchResult.displayName}</p>
                    <p className="text-[10px] text-muted font-mono">{searchResult.personalInviteCode}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendRequest(searchResult.uid)}
                  disabled={requestSent}
                  className="bg-primary text-surface px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {requestSent ? (
                    <>
                      <UserCheck size={12} /> 已傳送
                    </>
                  ) : (
                    "發送申請"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}