import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

export interface RatingPayload {
  targetUserId: string;
  score: number; // 1 ~ 5
}

export async function submitUserRatings(ratings: RatingPayload[]) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. 先讀取所有目標使用者的當前資料
      const userDocs = await Promise.all(
        ratings.map(r => transaction.get(doc(db, "users", r.targetUserId)))
      );

      // 2. 計算新分數並寫入
      ratings.forEach((rating, index) => {
        const userDoc = userDocs[index];
        if (!userDoc.exists()) return;

        const data = userDoc.data();
        const currentRating = data.rating || 5.0;
        const meetupsCount = data.meetupsCount || 0;

        // 計算加權平均數：((當前分數 * 總局數) + 新分數) / (總局數 + 1)
        let newRating = ((currentRating * meetupsCount) + rating.score) / (meetupsCount + 1);
        
        // 四捨五入至小數點後兩位
        newRating = Math.round(newRating * 100) / 100;

        transaction.update(doc(db, "users", rating.targetUserId), {
          rating: newRating,
          meetupsCount: meetupsCount + 1
        });
      });
    });
    return true;
  } catch (error) {
    console.error("評分更新失敗:", error);
    throw error;
  }
}