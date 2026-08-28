import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch } from "firebase/firestore";

export interface BlockRecord {
  uid: string;
  remark: string;
}

// 1. 發送好友邀請
export async function sendFriendRequest(currentUid: string, targetUid: string) {
  const targetRef = doc(db, "users", targetUid);
  await updateDoc(targetRef, {
    pendingRequests: arrayUnion(currentUid)
  });
}

// 2. 接受好友邀請
export async function acceptFriendRequest(currentUid: string, targetUid: string) {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, "users", currentUid);
  const targetUserRef = doc(db, "users", targetUid);

  // 互相加入好友名單，並從待處理清單中移除
  batch.update(currentUserRef, {
    friends: arrayUnion(targetUid),
    pendingRequests: arrayRemove(targetUid)
  });
  batch.update(targetUserRef, {
    friends: arrayUnion(currentUid)
  });

  await batch.commit();
}

// 3. 封鎖使用者
export async function blockUser(currentUid: string, targetUid: string, remark: string) {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, "users", currentUid);
  const targetUserRef = doc(db, "users", targetUid);

  // 寫入黑名單物件，同時解除雙方好友關係
  batch.update(currentUserRef, {
    blocked: arrayUnion({ uid: targetUid, remark }),
    friends: arrayRemove(targetUid)
  });
  batch.update(targetUserRef, {
    friends: arrayRemove(currentUid)
  });

  await batch.commit();
}