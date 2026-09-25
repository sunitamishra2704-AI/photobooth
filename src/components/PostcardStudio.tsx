import React, { useState } from 'react';
import { PostcardData, FilterType, BorderType, StickerItem } from '../types';
import { VINTAGE_STAMPS } from '../utils/stamps';
import { playTapeSound } from '../utils/audio';

interface PostcardStudioProps {
  data: PostcardData;
  onChangeData: (updater: (prev: PostcardData) => PostcardData) => void;
  onRetake: () => void;
  onExportHD: () => void;
  onPrint: () => void;
  onShare: () => void;
  onOpenRoll: () => void;
  onOpenStampSelector: () => void;
  onOpenEditNote: () => void;
  onOpenLiveCoach: () => void;
  savedRollCount: number;
}

export const PostcardStudio: React.FC<PostcardStudioProps> = ({
  data,
  onChangeData,
  onRetake,
  onExportHD,
  onPrint,
  onShare,
  onOpenRoll,
  onOpenStampSelector,
  onOpenEditNote,
  onOpenLiveCoach,
  savedRollCount,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'stickers' | 'borders' | 'note'>('filters');

  const selectedStamp = VINTAGE_STAMPS.find((s) => s.id === data.stampId) || VINTAGE_STAMPS[0];

  // Sticker catalogue
  const AVAILABLE_STICKERS: { label: string; bg: string; text: string }[] = [
    { label: '★ CERTIFIED RETRO ★', bg: '#fec736', text: '#1e1b18' },
    { label: '💌 AIR MAIL SPECIAL', bg: '#db3320', text: '#ffffff' },
    { label: '⚡ ELECTRIC NIGHT', bg: '#1e1b18', text: '#fec736' },
    { label: '🌸 SAKURA BLOOM', bg: '#ffdad6', text: '#ba1a1a' },
    { label: '✨ PURE MAGIC', bg: '#79f7e3', text: '#00201c' },
    { label: '🍒 RETRO VIBES', bg: '#ffd1dc', text: '#880e4f' },
    { label: '📸 FIRST TAKE', bg: '#faf2ed', text: '#1e1b18' },
    { label: '☕ ARCADE CREW', bg: '#ffdf9a', text: '#5a4300' },
  ];

  const handleToggleSticker = (stickerObj: { label: string; bg: string; text: string }) => {
    playTapeSound();
    onChangeData((prev) => {
      const exists = prev.stickers.some((s) => s.label === stickerObj.label);
      if (exists) {
        return {
          ...prev,
          stickers: prev.stickers.filter((s) => s.label !== stickerObj.label),
        };
      } else {
        const newSticker: StickerItem = {
          id: `${Date.now()}-${Math.random()}`,
          label: stickerObj.label,
          variant: 'badge',
          x: 20 + Math.random() * 50,
          y: 60 + Math.random() * 20,
          rotation: (Math.random() * 16 - 8),
          bgColor: stickerObj.bg,
          color: stickerObj.text,
        };
        return {
          ...prev,
          stickers: [...prev.stickers, newSticker],
        };
      }
    });
  };

  const handleSelectFilter = (filter: FilterType) => {
    onChangeData((prev) => ({ ...prev, filter }));
  };

  const handleSelectBorder = (border: BorderType) => {
    onChangeData((prev) => ({ ...prev, border }));
  };

  // Get Border Class
  const getBorderClass = (border: BorderType) => {
    switch (border) {
      case 'gold':
        return 'airmail-border-gold';
      case 'mint':
        return 'airmail-border-mint';
      case 'coral':
        return 'airmail-border-coral';
      case 'noir':
        return 'airmail-border-noir';
      default:
        return 'airmail-border';
    }
  };

  return (
    <div className="bg-[#fff8f4] text-[#1e1b18] min-h-screen pb-40 antialiased selection:bg-[#fec736] selection:text-[#705400]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#fff8f4]/95 backdrop-blur-sm border-b-2 border-[#1e1b18] [box-shadow:0px_3px_0px_#1e1b18] px-4 py-2 flex items-center justify-between">
        <button
          onClick={onRetake}
          className="flex items-center gap-1.5 py-1 px-3 rounded-lg border-2 border-[#1e1b18] bg-[#f4ece7] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="font-label text-[11px] font-bold uppercase tracking-wider">Retake</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-headline text-lg sm:text-xl font-bold uppercase tracking-wide text-[#b71607]">
            Postcard Studio
          </span>
          <span className="font-label text-[10px] tracking-widest text-[#5c403b] uppercase">
            Style • Customise • Print
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenLiveCoach}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border-2 border-[#1e1b18] bg-[#00685c] text-white [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all cursor-pointer hover:bg-[#005047]"
            title="Start real-time voice conversation with Booth Attendant powered by gemini-3.8-live"
          >
            <span className="text-[14px]">🎙️</span>
            <span className="font-label text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
              Attendant (Live)
            </span>
            <span className="font-label text-[11px] font-bold uppercase tracking-wider sm:hidden">
              Live
            </span>
          </button>

          <button
            onClick={onExportHD}
            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border-2 border-[#1e1b18] bg-[#fec736] text-[#251a00] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span className="font-label text-[11px] font-bold uppercase tracking-wider">Export HD</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        {/* PRINTER CONNECTION STATUS BANNER */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#79f7e3] text-[#00201c] rounded-lg border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00685c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00685c]" />
            </span>
            <span className="font-label text-[11px] uppercase tracking-wider font-bold">
              Connected: Canon Selphy CP1500 • Ready
            </span>
          </div>
          <span className="material-symbols-outlined text-[#00685c] text-[18px]">print</span>
        </div>

        {/* POSTCARD WORKBENCH / CANVAS */}
        <div
          className={`relative p-2 md:p-3 ${getBorderClass(
            data.border
          )} rounded-xl border-2 border-[#1e1b18] [box-shadow:4px_4px_0px_#1e1b18]`}
        >
          {/* Actual Cream Card Body */}
          <div className="relative bg-[#faf2ed] paper-grain rounded-lg border-2 border-[#1e1b18] p-4 md:p-6 overflow-hidden">
            {/* Washi Tape Pin Top Left */}
            <div className="absolute -top-2 left-6 z-20 w-16 h-5 bg-[#ffdf9a]/90 rotate-[-4deg] border border-[#1e1b18]/30 [box-shadow:1px_1px_2px_rgba(0,0,0,0.15)] pointer-events-none" />

            {/* Postcard Split Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDE: Polaroid Frame With Photo */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div className="relative w-full max-w-[310px] bg-white p-3 pb-8 rounded border-2 border-[#1e1b18] [box-shadow:3px_3px_0px_#1e1b18] rotate-[-1.5deg] transition-transform hover:rotate-0">
                  {/* Captured Photo Image */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden border-2 border-[#1e1b18] rounded-xs bg-[#e0d9d3]">
                    <img
                      alt="Captured photobooth snapshot"
                      className={`w-full h-full object-cover object-center filter-${data.filter}`}
                      src={data.photoUrl}
                    />
                    {/* Retro Stamp Watermark on photo */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#b71607]/90 text-white font-label text-[10px] rounded border border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] font-bold">
                      {data.stampWatermark || 'BOOTH #04'}
                    </div>
                  </div>

                  {/* Polaroid Chin Timestamp & Badge */}
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="font-label text-[11px] text-[#1e1b18] tracking-wider font-bold">
                      {data.chinDateText || 'JULY 24 • BOOTH #04'}
                    </span>
                    <span
                      onClick={onOpenEditNote}
                      className="font-handwrite text-xl text-[#b71607] leading-none cursor-pointer hover:underline"
                      title="Click to edit cursive caption"
                    >
                      {data.chinHandwrittenText || 'smiles forever ♡'}
                    </span>
                  </div>

                  {/* Vintage Sticker Pinned on corner */}
                  <div className="absolute -bottom-3 -right-3 z-10 bg-[#fec736] text-[#705400] px-2.5 py-1 rounded-full border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] rotate-[8deg]">
                    <span className="font-label text-[10px] uppercase font-bold tracking-tight">
                      ★ CERTIFIED RETRO ★
                    </span>
                  </div>

                  {/* Extra user-added stickers on polaroid */}
                  {data.stickers.map((stk) => (
                    <div
                      key={stk.id}
                      style={{
                        transform: `rotate(${stk.rotation}deg)`,
                        backgroundColor: stk.bgColor || '#fec736',
                        color: stk.color || '#1e1b18',
                      }}
                      className="absolute z-20 px-2 py-0.5 rounded-full border-2 border-[#1e1b18] [box-shadow:1.5px_1.5px_0px_#1e1b18] text-[9px] font-label font-black tracking-tight"
                    >
                      {stk.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE: Classic Vintage Postcard Back */}
              <div className="md:col-span-6 flex flex-col justify-between h-full space-y-4 md:border-l-2 md:border-dashed md:border-[#906f6a]/50 md:pl-6">
                {/* Top Stamp & Cancellation Row */}
                <div className="flex items-start justify-between gap-2">
                  {/* Rubber Stamp Cancellation Mark */}
                  <div
                    onClick={onOpenEditNote}
                    className="relative rotate-[-6deg] p-1.5 border-2 border-dashed border-[#b71607] text-[#b71607] rounded-md flex flex-col items-center justify-center text-center opacity-90 select-none cursor-pointer hover:opacity-100 transition-opacity"
                    title="Click to customize postmark"
                  >
                    <div className="font-label text-[9px] uppercase tracking-widest font-black leading-tight">
                      {data.cancellationTitle || 'AIR MAIL • EXPRESS'}
                    </div>
                    <div className="h-[1px] w-full bg-[#b71607] my-0.5" />
                    <div className="font-headline text-xs uppercase tracking-wider font-extrabold">
                      {data.cancellationLocation || 'LOS ANGELES, CA'}
                    </div>
                    <div className="font-label text-[8px] tracking-wider font-semibold">
                      {data.cancellationDate || 'JUL 24 • 1974 • POSTED'}
                    </div>
                  </div>

                  {/* Postage Stamp Display */}
                  <div
                    onClick={onOpenStampSelector}
                    className="relative group cursor-pointer"
                    title="Click to swap postage stamp"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 p-1 bg-white border-2 border-[#1e1b18] rounded [box-shadow:2px_2px_0px_#1e1b18] rotate-[2deg] transition-transform group-hover:scale-105">
                      <img
                        alt={selectedStamp.title}
                        className="w-full h-full object-contain"
                        src={selectedStamp.imageUrl}
                      />
                    </div>
                    {/* Swap badge */}
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#fff8f4] text-[#1e1b18] font-label text-[8px] px-1.5 py-0.5 border border-[#1e1b18] rounded-full shadow whitespace-nowrap font-bold group-hover:bg-[#fec736]">
                      TAP TO SWAP
                    </span>
                  </div>
                </div>

                {/* Handwritten Message Canvas */}
                <div className="relative bg-white/80 p-3.5 rounded-lg border-2 border-[#1e1b18] [box-shadow:inset_2px_2px_0px_rgba(0,0,0,0.06)] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#e5beb7] pb-1">
                    <span className="font-label text-[10px] text-[#5c403b] uppercase tracking-wider flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">edit_note</span>{' '}
                      Handwritten Note
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onOpenEditNote}
                        className="text-[#00685c] hover:underline font-label text-[10px] uppercase font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Dictate with microphone via gemini-3.5-transcribe"
                      >
                        <span className="material-symbols-outlined text-[12px]">mic</span>
                        <span>Dictate</span>
                      </button>
                      <span className="text-neutral-400">•</span>
                      <button
                        onClick={onOpenEditNote}
                        className="text-[#b71607] hover:underline font-label text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <p
                    onClick={onOpenEditNote}
                    className="font-handwrite text-xl md:text-2xl text-[#1e1b18] leading-tight pt-1 cursor-pointer"
                  >
                    "{data.noteText.replace(/^"|"$/g, '')}"
                  </p>
                  {/* Faux Postcard Ruled Lines */}
                  <div className="pt-2 space-y-3 opacity-30 pointer-events-none">
                    <div className="border-b border-[#1e1b18]" />
                    <div className="border-b border-[#1e1b18]" />
                  </div>
                </div>

                {/* Postcard Recipient Lines */}
                <div
                  onClick={onOpenEditNote}
                  className="space-y-2.5 pt-2 cursor-pointer group"
                  title="Click to edit recipient address"
                >
                  <div className="flex items-center gap-2 border-b-2 border-[#1e1b18] pb-1 group-hover:border-[#db3320]">
                    <span className="font-label text-[10px] text-[#5c403b] uppercase w-12 font-bold">
                      TO:
                    </span>
                    <span className="font-label text-sm text-[#1e1b18] font-bold">
                      {data.recipientTo || 'The Best Friends Forever'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b-2 border-[#1e1b18] pb-1 group-hover:border-[#db3320]">
                    <span className="font-label text-[10px] text-[#5c403b] uppercase w-12 font-bold">
                      AT:
                    </span>
                    <span className="font-label text-sm text-[#1e1b18] font-bold">
                      {data.recipientAt || 'Arcade Lane, Booth #04'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMIZATION TOOLBAR SECTION */}
        <section className="bg-[#f4ece7] rounded-xl border-2 border-[#1e1b18] p-4 [box-shadow:3px_3px_0px_#1e1b18] space-y-4">
          {/* Toolbar Tabs / Pills */}
          <div className="flex items-center justify-between border-b-2 border-[#1e1b18] pb-3 flex-wrap gap-2">
            <h2 className="font-headline text-base sm:text-lg uppercase tracking-tight text-[#1e1b18] flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[#b71607] text-[20px]">palette</span>
              Customise Strip
            </h2>

            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('stickers')}
                className={`px-3 py-1 rounded-full text-[11px] font-label font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'stickers'
                    ? 'bg-[#00685c] text-white border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18]'
                    : 'bg-[#fff8f4] text-[#1e1b18] border-2 border-[#1e1b18] hover:bg-[#e9e1dc]'
                }`}
              >
                Stickers
              </button>

              <button
                onClick={() => setActiveTab('filters')}
                className={`px-3 py-1 rounded-full text-[11px] font-label font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'filters'
                    ? 'bg-[#00685c] text-white border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18]'
                    : 'bg-[#fff8f4] text-[#1e1b18] border-2 border-[#1e1b18] hover:bg-[#e9e1dc]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                Filters
              </button>

              <button
                onClick={() => setActiveTab('borders')}
                className={`px-3 py-1 rounded-full text-[11px] font-label font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'borders'
                    ? 'bg-[#00685c] text-white border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18]'
                    : 'bg-[#fff8f4] text-[#1e1b18] border-2 border-[#1e1b18] hover:bg-[#e9e1dc]'
                }`}
              >
                Borders
              </button>

              <button
                onClick={onOpenEditNote}
                className="px-3 py-1 rounded-full text-[11px] font-label font-bold uppercase bg-[#fff8f4] text-[#1e1b18] border-2 border-[#1e1b18] hover:bg-[#e9e1dc] transition-all cursor-pointer"
              >
                Note ✎
              </button>

              <button
                onClick={onOpenLiveCoach}
                className="px-3 py-1 rounded-full text-[11px] font-label font-bold uppercase bg-[#ffdf9a] text-[#5a4300] border-2 border-[#1e1b18] hover:bg-[#fec736] transition-all flex items-center gap-1 cursor-pointer"
                title="Open Live Voice Conversation with Booth Attendant (gemini-3.8-live)"
              >
                <span>🎙️</span>
                <span>Voice Coach</span>
              </button>
            </div>
          </div>

          {/* Tab 1: FILTERS */}
          {activeTab === 'filters' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label text-[11px] text-[#5c403b] uppercase tracking-wider block font-bold">
                  Retro Film Filters & Tones:
                </span>
                <span className="font-label text-[10px] text-[#b71607] uppercase font-bold tracking-wider">
                  Active: {data.filter.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  {
                    id: 'golden',
                    label: "'70s Golden Glow",
                    sub: 'Warm Nostalgia',
                    badge: 'GOLDEN',
                    gradient: 'from-[#785a00] to-[#fec736]',
                  },
                  {
                    id: 'bw',
                    label: 'B&W Film Noir',
                    sub: 'Hi-Contrast Mono',
                    badge: 'B&W',
                    gradient: 'from-[#1e1b18] via-[#888] to-[#fff]',
                  },
                  {
                    id: 'pastel',
                    label: 'Soft Pastel',
                    sub: 'Vintage Magenta',
                    badge: 'DREAM',
                    gradient: 'from-[#ffdad4] to-[#79f7e3]',
                  },
                  {
                    id: 'kodak',
                    label: 'Kodak 800',
                    sub: 'Warm Grain Pop',
                    badge: '800 ISO',
                    gradient: 'from-[#b71607] via-[#fec736] to-[#fff8f4]',
                  },
                  {
                    id: 'flash',
                    label: 'Vivid Instant',
                    sub: 'Punchy Saturation',
                    badge: 'FLASH',
                    gradient: 'from-[#db3320] to-[#ffdf9a]',
                  },
                  {
                    id: 'cyan',
                    label: 'Cool Cyan',
                    sub: 'Cross-Process',
                    badge: 'CYAN',
                    gradient: 'from-[#00685c] to-[#59dbc7]',
                  },
                ].map((f) => {
                  const isCur = data.filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFilter(f.id as FilterType)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all text-left cursor-pointer ${
                        isCur
                          ? 'bg-[#ffdf9a] ring-2 ring-[#b71607] ring-offset-1'
                          : 'bg-[#fff8f4] hover:bg-[#eee7e1]'
                      }`}
                    >
                      <div
                        className={`w-full h-8 rounded border border-[#1e1b18] mb-1.5 overflow-hidden relative bg-gradient-to-tr ${f.gradient} flex items-center justify-center`}
                      >
                        <span className="font-label text-[9px] text-white font-black tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                          {f.badge}
                        </span>
                        {isCur && (
                          <span className="material-symbols-outlined absolute top-1 right-1 text-white text-[14px] font-bold drop-shadow">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className="font-label text-[10px] uppercase font-bold text-[#1e1b18] leading-tight text-center">
                        {f.label}
                      </span>
                      <span className="font-label text-[8px] text-[#5c403b] text-center">
                        {f.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: STICKERS */}
          {activeTab === 'stickers' && (
            <div className="space-y-2">
              <span className="font-label text-[11px] text-[#5c403b] uppercase tracking-wider block font-bold">
                Tap a sticker to pin/remove from postcard:
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_STICKERS.map((stk) => {
                  const isApplied = data.stickers.some((s) => s.label === stk.label);
                  return (
                    <button
                      key={stk.label}
                      onClick={() => handleToggleSticker(stk)}
                      style={{
                        backgroundColor: isApplied ? stk.bg : '#ffffff',
                        color: isApplied ? stk.text : '#1e1b18',
                      }}
                      className={`px-3 py-1.5 rounded-full border-2 border-[#1e1b18] font-label text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                        isApplied
                          ? '[box-shadow:2px_2px_0px_#1e1b18] ring-2 ring-[#b71607]'
                          : '[box-shadow:1px_1px_0px_#1e1b18] hover:bg-[#eee]'
                      }`}
                    >
                      {stk.label} {isApplied ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: BORDERS */}
          {activeTab === 'borders' && (
            <div className="space-y-2">
              <span className="font-label text-[11px] text-[#5c403b] uppercase tracking-wider block font-bold">
                Choose Airmail Border Style:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'classic', label: 'Classic Airmail', style: 'airmail-border' },
                  { id: 'gold', label: 'Golden Sunset', style: 'airmail-border-gold' },
                  { id: 'mint', label: 'Vintage Teal', style: 'airmail-border-mint' },
                  { id: 'coral', label: 'Coral Tangerine', style: 'airmail-border-coral' },
                  { id: 'noir', label: 'Film Noir Mono', style: 'airmail-border-noir' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBorder(b.id as BorderType)}
                    className={`p-2 rounded-xl border-2 border-[#1e1b18] transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      data.border === b.id
                        ? 'bg-[#ffdf9a] ring-2 ring-[#b71607]'
                        : 'bg-white hover:bg-[#eee]'
                    }`}
                  >
                    <div className={`w-full h-8 rounded border border-[#1e1b18] ${b.style}`} />
                    <span className="font-label text-[10px] font-bold uppercase">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Border Palette row on bottom */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#1e1b18]/20">
            <span className="font-label text-[11px] text-[#5c403b] uppercase tracking-wider font-bold">
              Strip Border:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectBorder('classic')}
                className={`w-6 h-6 rounded-full airmail-border border-2 border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] cursor-pointer ${
                  data.border === 'classic' ? 'ring-2 ring-[#b71607] ring-offset-1' : ''
                }`}
                title="Classic Airmail"
              />
              <button
                onClick={() => handleSelectBorder('gold')}
                className={`w-6 h-6 rounded-full airmail-border-gold border-2 border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] cursor-pointer ${
                  data.border === 'gold' ? 'ring-2 ring-[#b71607] ring-offset-1' : ''
                }`}
                title="Golden Sunset"
              />
              <button
                onClick={() => handleSelectBorder('mint')}
                className={`w-6 h-6 rounded-full airmail-border-mint border-2 border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] cursor-pointer ${
                  data.border === 'mint' ? 'ring-2 ring-[#b71607] ring-offset-1' : ''
                }`}
                title="Vintage Mint"
              />
              <button
                onClick={() => handleSelectBorder('coral')}
                className={`w-6 h-6 rounded-full airmail-border-coral border-2 border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] cursor-pointer ${
                  data.border === 'coral' ? 'ring-2 ring-[#b71607] ring-offset-1' : ''
                }`}
                title="Coral Tangerine"
              />
              <button
                onClick={() => handleSelectBorder('noir')}
                className={`w-6 h-6 rounded-full airmail-border-noir border-2 border-[#1e1b18] [box-shadow:1px_1px_0px_#1e1b18] cursor-pointer ${
                  data.border === 'noir' ? 'ring-2 ring-[#b71607] ring-offset-1' : ''
                }`}
                title="Noir Mono"
              />
            </div>
          </div>
        </section>
      </main>

      {/* FIXED BOTTOM PRIMARY ACTION DOCK */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#f4ece7] border-t-2 border-[#1e1b18] [box-shadow:0px_-3px_0px_#1e1b18] px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Secondary Actions: Save Roll & Share */}
          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              onClick={onOpenRoll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#fff8f4] border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all cursor-pointer relative"
            >
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              <span className="font-label text-[12px] uppercase font-bold text-[#1e1b18]">
                Save Roll
              </span>
              {savedRollCount > 0 && (
                <span className="bg-[#b71607] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {savedRollCount}
                </span>
              )}
            </button>

            <button
              onClick={onShare}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#fff8f4] border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:0px_0px_0px_#1e1b18] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="font-label text-[12px] uppercase font-bold text-[#1e1b18]">Share</span>
            </button>
          </div>

          {/* Giant Shutter / Print Arcade Button */}
          <button
            onClick={onPrint}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-[#db3320] text-white border-2 border-[#1e1b18] [box-shadow:4px_4px_0px_#1e1b18] active:translate-x-[3px] active:translate-y-[3px] active:[box-shadow:1px_1px_0px_#1e1b18] transition-all cursor-pointer group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🖨️</span>
            <span className="font-headline text-base sm:text-lg font-bold uppercase tracking-wide">
              PRINT POSTCARD
            </span>
            <span className="font-label text-[10px] bg-white text-[#db3320] px-2 py-0.5 rounded-full ml-1 font-extrabold uppercase">
              GLOSSY 4×6
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
