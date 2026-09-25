import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedImageUrl: string | null;
  onDownload: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  renderedImageUrl,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (renderedImageUrl) {
          // Convert dataURL to blob for native file sharing
          const response = await fetch(renderedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'postcard-studio-booth04.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Postcard Studio - Booth #04',
              text: 'Check out our retro photobooth postcard!',
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: 'Postcard Studio - Booth #04',
          text: 'Check out our retro photobooth postcard!',
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Native share error or dismissed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyImage = async () => {
    if (!renderedImageUrl) return;
    try {
      const response = await fetch(renderedImageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#faf2ed] border-3 border-[#1e1b18] rounded-2xl w-full max-w-md overflow-hidden [box-shadow:6px_6px_0px_#1e1b18] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1e1b18] text-[#fff8f4] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fec736]">share</span>
            <h3 className="font-headline text-base font-bold uppercase tracking-wide text-[#fec736]">
              Share Postcard
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#2a2420] text-white border border-white/20 flex items-center justify-center hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Card Preview */}
          {renderedImageUrl && (
            <div className="rounded-lg overflow-hidden border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] aspect-[3/2] bg-[#eee]">
              <img src={renderedImageUrl} alt="Postcard preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-xl bg-[#db3320] text-white font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Send / AirDrop</span>
            </button>

            <button
              onClick={onDownload}
              className="py-3 px-3 rounded-xl bg-[#fec736] text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Save Image</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyImage}
              className="flex-1 py-2.5 px-3 rounded-lg bg-white text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Copy Image</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-3 rounded-lg bg-white text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
