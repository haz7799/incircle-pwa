"use client";

import { useState } from "react";

export default function CreateRoom() {
  const [isPublic, setIsPublic] = useState(true);

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-minimal">
      <div className="flex bg-background rounded-lg p-1 mb-6">
        <button 
          onClick={() => setIsPublic(true)}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isPublic ? 'bg-surface shadow-sm text-primary' : 'text-muted'}`}
        >
          公開招募
        </button>
        <button 
          onClick={() => setIsPublic(false)}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isPublic ? 'bg-surface shadow-sm text-primary' : 'text-muted'}`}
        >
          私密房間
        </button>
      </div>

      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-bold text-primary mb-1">房間名稱</label>
          <input type="text" placeholder="輸入標題" className="w-full border border-border rounded-lg p-3" required />
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-primary mb-1">人數上限</label>
            <input type="number" placeholder="例如: 4" className="w-full border border-border rounded-lg p-3" required />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-primary mb-1">目的</label>
            <select className="w-full border border-border rounded-lg p-3 bg-surface">
              <option>約飯</option>
              <option>City Walk</option>
              <option>追星搭子</option>
              <option>玩樂</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-1">付錢方式</label>
          <select className="w-full border border-border rounded-lg p-3 bg-surface">
            <option>AA制 (平分)</option>
            <option>AB制 (按比例)</option>
            <option>車主/發起人全付</option>
            <option>另議</option>
          </select>
        </div>

        <button type="submit" className="w-full bg-primary text-surface rounded-lg py-3 font-medium mt-4">
          {isPublic ? "開啟公開房間" : "生成專屬 Room Key"}
        </button>
      </form>
    </div>
  );
}