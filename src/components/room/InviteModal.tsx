"use client";

import { useState } from "react";
import { X, Copy, Share2, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface InviteModalProps {
  roomId: string;
  roomTitle: string;
  onClose: () => void;
}

export default function InviteModal({ roomId, roomTitle, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  // 動態獲取當前網域生成完整邀請連結
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/room/${roomId}` 
    : `https://incircle-pwa.vercel.app/room/${roomId}`;

  // 1. 複製連結至剪貼簿
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("複製連結失敗:", err);
    }
  };

  // 2. 觸發原生系統分享（iOS / Android PWA）
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `加入局內組局：${roomTitle}`,
          text: `邀請你加入「${roomTitle}」，點擊連結一起同頻組局與分帳！`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("分享失敗:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-5 shadow-xl border border-border space-y-4">
        {/* 標題列 */}
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">邀請同頻搭子</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* 房間邀請卡片 */}
        <div className="bg-background border border-border rounded-xl p-4 text-center space-y-2">
          <p className="text-[10px] text-muted font-mono uppercase tracking-wider">房間 ID: {roomId}</p>
          <h4 className="text-base font-extrabold text-primary">{roomTitle}</h4>
          <p className="text-xs text-secondary">掃描 QR Code 或複製連結即可進局</p>
        </div>

        {/* QR Code 展示區塊 */}
        {showQr && (
          <div className="bg-background border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2">
            <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
              <QRCodeSVG
                value={shareUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#171717"
                level="M"
              />
            </div>
            <p className="text-[10px] text-muted">使用手機相機或微信/Line 掃描</p>
          </div>
        )}

        {/* 連結展示與複製按鈕 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-secondary">專屬組局連結</label>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-[10px] text-secondary hover:text-primary flex items-center gap-1 underline"
            >
              <QrCode size={12} />
              {showQr ? "收起 QR Code" : "顯示 QR Code"}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-primary focus:outline-none truncate px-1"
            />
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                copied
                  ? "bg-primary text-surface"
                  : "bg-surface text-primary border border-border hover:bg-background"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "已複製" : "複製"}</span>
            </button>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 pt-2">
          {"share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex-1 py-2.5 text-xs font-medium text-surface bg-primary rounded-xl flex items-center justify-center gap-1.5 shadow-minimal active:scale-[0.98] transition-transform"
            >
              <Share2 size={14} />
              直接分享
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-medium text-secondary bg-background rounded-xl border border-border"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}