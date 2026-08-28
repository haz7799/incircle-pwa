import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, QueryDocumentSnapshot } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// 初始化 Firebase Admin
initializeApp();
const db = getFirestore();

// 1. 安全核銷邀請碼 (HTTPS Callable)
export const redeemInviteCode = onCall(async (request) => {
  const code = request.data.code;
  const uid = request.data.uid;

  if (!code || !uid) {
    throw new HttpsError("invalid-argument", "參數錯誤");
  }

  const codeRef = db.collection("invite_codes").doc(code);

  return db.runTransaction(async (t) => {
    const docSnap = await t.get(codeRef);
    const docData = docSnap.data();

    if (!docSnap.exists || (docData && docData.isUsed)) {
      throw new HttpsError("failed-precondition", "邀請碼無效或已被使用");
    }

    // 標記為已使用並綁定使用者
    t.update(codeRef, {
      isUsed: true,
      usedBy: uid,
      usedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
});

// 2. 房間完局自動觸發器 (Firestore Trigger)
export const onRoomEnded = onDocumentUpdated("rooms/{roomId}", async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();

  // 攔截狀態變更為 ended 的瞬間
  if (newValue?.status === "ended" && previousValue?.status !== "ended") {
    const roomId = event.params.roomId;

    // 將房間內的 schedules 子集合清空以節省資料庫空間
    const schedulesRef = db.collection(`rooms/${roomId}/schedules`);
    const snapshot = await schedulesRef.get();

    const batch = db.batch();
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`房間 ${roomId} 已完局，行程表資料已封存清理。`);
  }
});