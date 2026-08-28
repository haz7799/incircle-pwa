export interface TimeSlotRecord {
  timestamp: number; // 30分鐘區塊的起始時間
  availableUsers: string[];
  matchRate: number; // 0 ~ 1 之間
}

export interface UserSchedule {
  userId: string;
  userName: string;
  selectedSlots: number[]; // 該用戶選擇的所有 timestamp 陣列
}

export function calculateCommonSlots(
  schedules: UserSchedule[],
  totalMembers: number
): TimeSlotRecord[] {
  const slotMap = new Map<number, Set<string>>();

  // 1. 遍歷所有用戶的時間表，將用戶 ID 映射至對應的時間塊
  schedules.forEach(({ userId, selectedSlots }) => {
    selectedSlots.forEach((slot) => {
      if (!slotMap.has(slot)) {
        slotMap.set(slot, new Set());
      }
      slotMap.get(slot)!.add(userId);
    });
  });

  // 2. 轉換為陣列並計算匹配率
  const results: TimeSlotRecord[] = Array.from(slotMap.entries()).map(
    ([timestamp, usersSet]) => ({
      timestamp,
      availableUsers: Array.from(usersSet),
      matchRate: usersSet.size / totalMembers,
    })
  );

  // 3. 排序：優先顯示人數最多的時段；若人數相同，則按時間先後排序
  return results.sort((a, b) => {
    if (b.availableUsers.length !== a.availableUsers.length) {
      return b.availableUsers.length - a.availableUsers.length;
    }
    return a.timestamp - b.timestamp;
  });
}