import React from 'react';
import { PostcardData } from '../types';

interface PhotoRollDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoll: PostcardData[];
  onSelectCard: (card: PostcardData) => void;
  onDeleteCard: (id: string) => void;
}

export const PhotoRollDrawer: React.FC<PhotoRollDrawerProps> = ({
  isOpen,
  onClose,
  savedRoll,
  onSelectCard,
  onDeleteCard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-[#faf2ed] border-l-4 border-[#1e1b18] w-full max-w-md h-full flex flex-col [box-shadow:-6px_0px_0px_#1e1b18] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-[#1e1b18] text-[#fff8f4] p-4 flex items-center justify-between border-b-2 border-[#1e1b18]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fec736]">photo_library</span>
            <div>
              <h3 className="font-headline text-base font-bold uppercase tracking-wide text-[#fec736]">
                Saved Photo Roll
              </h3>
              <p className="font-label text-[10px] text-white/70 uppercase">
                {savedRoll.length} {savedRoll.length === 1 ? 'Postcard' : 'Postcards'} in Archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2a2420] text-white border border-white/20 flex items-center justify-center hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* List of cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {savedRoll.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#5c403b] space-y-3">
              <span className="material-symbols-outlined text-5xl opacity-40">photo_library</span>
              <p className="font-headline text-lg font-bold">Your roll is empty!</p>
              <p className="font-label text-xs">
                Take photos in the booth and hit "Save Roll" to archive your vintage postcards here.
              </p>
            </div>
          ) : (
            savedRoll.map((card, idx) => (
              <div
                key={card.id || idx}
                className="bg-white rounded-xl border-2 border-[#1e1b18] p-3 [box-shadow:3px_3px_0px_#1e1b18] hover:border-[#db3320] transition-all flex gap-3 group relative"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => {
                    onSelectCard(card);
                    onClose();
                  }}
                  className="w-24 aspect-[3/4] bg-[#eee] rounded border border-[#1e1b18] overflow-hidden shrink-0 cursor-pointer relative"
                >
                  <img
                    src={card.photoUrl}
                    alt="Saved photo"
                    className={`w-full h-full object-cover filter-${card.filter}`}
                  />
                  <span className="absolute bottom-1 right-1 bg-black/75 text-white font-label text-[8px] px-1 rounded">
                    {card.filter}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div
                    onClick={() => {
                      onSelectCard(card);
                      onClose();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-label text-[10px] text-[#b71607] font-bold uppercase tracking-wider block">
                      {card.chinDateText}
                    </span>
                    <p className="font-handwrite text-lg text-[#1e1b18] leading-tight line-clamp-2 mt-0.5">
                      {card.noteText}
                    </p>
                    <span className="font-label text-[10px] text-[#5c403b] block mt-1">
                      To: {card.recipientTo}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <button
                      onClick={() => {
                        onSelectCard(card);
                        onClose();
                      }}
                      className="text-xs font-label font-bold text-[#b71607] hover:underline uppercase"
                    >
                      Open in Studio →
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCard(card.id);
                      }}
                      className="text-xs font-label text-neutral-400 hover:text-red-600 p-1"
                      title="Delete card"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
