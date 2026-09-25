import React from 'react';
import { VINTAGE_STAMPS } from '../utils/stamps';
import { playTapeSound } from '../utils/audio';

interface StampSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStampId: string;
  onSelectStamp: (stampId: string) => void;
}

export const StampSelectorModal: React.FC<StampSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedStampId,
  onSelectStamp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#faf2ed] border-3 border-[#1e1b18] rounded-2xl w-full max-w-lg overflow-hidden [box-shadow:6px_6px_0px_#1e1b18] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1e1b18] text-[#fff8f4] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fec736]">mail</span>
            <div>
              <h3 className="font-headline text-base font-bold uppercase tracking-wide text-[#fec736]">
                Vintage Postage Album
              </h3>
              <p className="font-label text-[10px] text-white/70 uppercase">
                Choose an authentic postal stamp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#2a2420] text-white border border-white/20 flex items-center justify-center hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Stamps Grid */}
        <div className="p-5 max-h-[70vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VINTAGE_STAMPS.map((stamp) => {
            const isSelected = stamp.id === selectedStampId;
            return (
              <button
                key={stamp.id}
                onClick={() => {
                  playTapeSound();
                  onSelectStamp(stamp.id);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#fec736]/30 border-[#db3320] [box-shadow:3px_3px_0px_#db3320] ring-2 ring-[#db3320]'
                    : 'bg-white border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] hover:border-[#db3320]'
                }`}
              >
                {/* Stamp visual */}
                <div className="w-20 h-24 p-1 bg-white border border-[#1e1b18] rounded mb-2 overflow-hidden relative flex items-center justify-center [box-shadow:1px_1px_0px_rgba(0,0,0,0.1)]">
                  <img
                    src={stamp.imageUrl}
                    alt={stamp.title}
                    className="w-full h-full object-contain"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#db3320] text-white rounded-full flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="font-headline text-xs font-bold text-[#1e1b18] leading-tight">
                  {stamp.title}
                </span>
                <span className="font-label text-[9px] text-[#5c403b] mt-0.5">
                  {stamp.subtitle}
                </span>
                <span className="mt-1 font-label text-[10px] font-black text-[#b71607] bg-[#fce7d2] px-2 py-0.5 rounded-full">
                  {stamp.denomination}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
