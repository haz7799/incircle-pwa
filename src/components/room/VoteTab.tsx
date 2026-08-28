"use client";

import { useState } from "react";
import { BarChart2, Plus, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export default function VoteTab({ roomId }: { roomId: string }) {
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  // Mock Data: 實務上請使用 onSnapshot 監聽 collection(db, "rooms", roomId, "votes")
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: "v1",
      question: "晚餐想吃什麼種類？",
      options: [
        { id: "o1", text: "日式火鍋 / 壽喜燒", voterIds: ["u1", "u2"] },
        { id: "o2", text: "港式大排檔", voterIds: ["u3"] },
      ]
    }
  ]);

  const handleVote = (pollId: string, optionId: string) => {
    if (!user) return;
    // 實務上在此呼叫 Firestore transaction 確保計票正確，並防止重複投票
    alert(`已投票給選項: ${optionId}`);
  };

  return (
    <div className="flex flex-col h-full bg-surface p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-primary" />
          <h3 className="font-bold text-primary">共同投票</h3>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs bg-primary text-surface px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Plus size={14} /> 新增
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voterIds.length, 0);
          
          return (
            <div key={poll.id} className="border border-border rounded-xl p-4 bg-background">
              <h4 className="font-bold text-primary mb-3">{poll.question}</h4>
              <div className="flex flex-col gap-2">
                {poll.options.map(opt => {
                  const isVoted = user && opt.voterIds.includes(user.uid);
                  const percent = totalVotes === 0 ? 0 : Math.round((opt.voterIds.length / totalVotes) * 100);
                  
                  return (
                    <button 
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      className="relative w-full text-left overflow-hidden rounded-lg border border-border bg-surface p-3 transition-colors active:bg-background"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-border/50 z-0 transition-all" 
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative z-10 flex justify-between items-center text-sm">
                        <span className={`font-medium flex items-center gap-2 ${isVoted ? 'text-primary' : 'text-secondary'}`}>
                          {isVoted && <CheckCircle2 size={14} />} {opt.text}
                        </span>
                        <span className="text-xs text-muted">{opt.voterIds.length} 票 ({percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}