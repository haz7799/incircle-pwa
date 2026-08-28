export type PaymentMethod = "AA" | "HOST" | "CUSTOM";

export interface Member {
  userId: string;
  userName: string;
  isHost?: boolean;
}

export interface SplitResult {
  userId: string;
  userName: string;
  amount: number;
}

export function calculateSplit(
  totalAmount: number,
  members: Member[],
  method: PaymentMethod
): SplitResult[] {
  if (totalAmount <= 0 || members.length === 0) return [];

  switch (method) {
    case "AA":
      // AA制：總額除以人數，並處理無法整除的餘數 (將餘數加在第一個人身上)
      const baseAmount = Math.floor((totalAmount / members.length) * 100) / 100;
      let remainder = Math.round((totalAmount - baseAmount * members.length) * 100) / 100;
      
      return members.map((member, index) => {
        let finalAmount = baseAmount;
        if (remainder > 0 && index === 0) {
          finalAmount += remainder;
        }
        return {
          userId: member.userId,
          userName: member.userName,
          amount: Number(finalAmount.toFixed(2)),
        };
      });

    case "HOST":
      // 車主/發起人全付
      return members.map((member) => ({
        userId: member.userId,
        userName: member.userName,
        amount: member.isHost ? totalAmount : 0,
      }));

    case "CUSTOM":
      // 自訂比例 (此處預設回傳 0，交由前端 UI 讓使用者手動輸入)
      return members.map((member) => ({
        userId: member.userId,
        userName: member.userName,
        amount: 0,
      }));

    default:
      return [];
  }
}