"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Users, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

interface FriendUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export default function InviteModal({
  roomId,
  roomTitle,
  onClose,
}: {
  roomId: string;
  roomTitle: string;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"link" | "friends">("friends");
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [invitedUids, setInvitedUids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : "";

  // 讀取好友名單
  useEffect(() => {
    async function fetchFriends() {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const friendIds: string[] = userDoc.data().friends || [];
          const list: FriendUser[] = [];
          for (const id of friendIds) {
            const fDoc = await getDoc(doc(db, "users", id));
            if (fDoc.exists()) {
              list.push({ uid: fDoc.id, ...fDoc.data() } as FriendUser);
            }
          }
          setFriends(list);
        }
      } catch (err) {
        console.error("讀取好友失敗:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 直接將好友加進房間
  const handleInviteFriend = async (friendUid: string) => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        members: arrayUnion(friendUid),
      });
      setInvitedUids((prev) => [...prev, friendUid]);
    } catch (err) {
      console.error("邀請好友進局失敗:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
        
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">邀請搭子進局</h3>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X size={16} />
          </button>
        </div>

        {/* 頁籤 */}
        <div className="flex bg-background border border-border rounded-xl p-1 text-xs">
          <button
            onClick={() => setTab("friends")}
            className={`flex-1 py-1.5 font-bold rounded-lg ${
              tab === "friends" ? "bg-surface text-primary shadow-minimal" : "text-muted"
            }`}
          >
            好友拉局
          </button>
          <button
            onClick={() => setTab("link")}
            className={`flex-1 py-1.5 font-bold rounded-lg ${
              tab === "link" ? "bg-surface text-primary shadow-minimal" : "text-muted"
            }`}
          >
            專屬連結
          </button>
        </div>

        {/* 1. 邀請好友 */}
        {tab === "friends" && (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {loading ? (
              <p className="text-xs text-muted text-center py-4">讀取好友名單中...</p>
            ) : friends.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">尚無好友名單，先去社交頁面添加吧！</p>
            ) : (
              friends.map((friend) => {
                const isInvited = invitedUids.includes(friend.uid);
                return (
                  <div
                    key={friend.uid}
                    className="bg-background border border-border rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={14} className="text-secondary" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-primary">{friend.displayName}</span>
                    </div>

                    <button
                      onClick={() => handleInviteFriend(friend.uid)}
                      disabled={isInvited}
                      className="bg-primary text-surface px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      {isInvited ? (
                        <>
                          <Check size={12} /> 已拉局
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} /> 一鍵加局
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. 複製連結 */}
        {tab === "link" && (
          <div className="space-y-3">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-primary font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="w-full bg-primary text-surface py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "已複製房間連結" : "複製房間專屬連結"}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}