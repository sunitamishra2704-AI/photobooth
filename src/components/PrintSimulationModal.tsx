import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playPrinterPassSound, playPrintFinishSound } from '../utils/audio';

interface PrintSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedImageUrl: string | null;
  onDownloadHD: () => void;
}

export const PrintSimulationModal: React.FC<PrintSimulationModalProps> = ({
  isOpen,
  onClose,
  renderedImageUrl,
  onDownloadHD,
}) => {
  const [pass, setPass] = useState<number>(1); // 1: Yellow, 2: Magenta, 3: Cyan, 4: Glossy Overcoat, 5: Done
  const [statusText, setStatusText] = useState('Feeding photo paper into Canon Selphy CP1500...');

  useEffect(() => {
    if (!isOpen) {
      setPass(1);
      return;
    }

    // Sequence of 4 passes
    const timers: NodeJS.Timeout[] = [];

    // Pass 1: Yellow
    timers.push(
      setTimeout(() => {
        setPass(1);
        setStatusText('Pass 1/4: Applying Yellow Dye Sublimation...');
        playPrinterPassSound(1);
      }, 500)
    );

    // Pass 2: Magenta
    timers.push(
      setTimeout(() => {
        setPass(2);
        setStatusText('Pass 2/4: Applying Magenta Dye Ribbon...');
        playPrinterPassSound(2);
      }, 2400)
    );

    // Pass 3: Cyan
    timers.push(
      setTimeout(() => {
        setPass(3);
        setStatusText('Pass 3/4: Applying Cyan Color Depth...');
        playPrinterPassSound(3);
      }, 4300)
    );

    // Pass 4: Glossy Overcoat
    timers.push(
      setTimeout(() => {
        setPass(4);
        setStatusText('Pass 4/4: Sealing with Protective Gloss Lamination...');
        playPrinterPassSound(4);
      }, 6200)
    );

    // Pass 5: Complete
    timers.push(
      setTimeout(() => {
        setPass(5);
        setStatusText('Print Complete! Your 4×6 Postcard is fresh and smudge-proof.');
        playPrintFinishSound();
        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#db3320', '#fec736', '#00685c', '#1e1b18'],
          });
        } catch {
          // ignore
        }
      }, 8100)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSystemPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#faf2ed] border-3 border-[#1e1b18] rounded-2xl w-full max-w-lg overflow-hidden [box-shadow:6px_6px_0px_#1e1b18] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="bg-[#1e1b18] text-[#fff8f4] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="font-headline text-base font-bold uppercase tracking-wide text-[#fec736]">
                Canon Selphy CP1500
              </h3>
              <p className="font-label text-[10px] text-white/70 uppercase">
                Thermal Dye-Sublimation • 300 DPI
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

        {/* Printer Tray Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Printer Output Slot */}
          <div className="w-full bg-[#3d3732] p-3 rounded-xl border-2 border-[#1e1b18] relative mb-6">
            <div className="w-3/4 mx-auto h-3 bg-[#111] rounded-full border border-white/10 mb-3" />

            {/* Postcard sliding out */}
            <div className="relative mx-auto w-64 aspect-[3/2] bg-white rounded border-2 border-[#1e1b18] overflow-hidden [box-shadow:2px_4px_8px_rgba(0,0,0,0.3)] transition-all duration-700">
              {renderedImageUrl ? (
                <img
                  src={renderedImageUrl}
                  alt="Printing Postcard"
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{
                    filter:
                      pass === 1
                        ? 'sepia(1) saturate(3) hue-rotate(15deg) contrast(1.2)' // Yellow pass
                        : pass === 2
                        ? 'hue-rotate(290deg) saturate(2.5) contrast(1.2)' // Magenta pass
                        : pass === 3
                        ? 'saturate(1.2) contrast(1.1)' // Full cyan/colors
                        : pass === 4
                        ? 'contrast(1.1) brightness(1.05)' // Gloss overcoat
                        : 'none', // Finish
                    transform:
                      pass === 1
                        ? 'translateY(-30%)'
                        : pass === 2
                        ? 'translateY(-15%)'
                        : pass === 3
                        ? 'translateY(-5%)'
                        : 'translateY(0%)',
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#faf2ed] flex items-center justify-center font-label text-xs">
                  Rendering Preview...
                </div>
              )}

              {/* Glossy Sheen sweep animation during pass 4 */}
              {pass === 4 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Tray eject indicator */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-label text-xs font-bold uppercase text-[#faf2ed]">
                {pass < 5 ? `Printing Pass ${pass} of 4` : 'Ready in Eject Tray'}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center space-y-1 mb-6">
            <p className="font-label text-xs uppercase tracking-wider font-bold text-[#b71607]">
              {statusText}
            </p>
            <div className="w-full bg-[#e9e1dc] h-2 rounded-full overflow-hidden border border-[#1e1b18]">
              <div
                className="bg-[#db3320] h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (pass / 4) * 100)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSystemPrint}
              disabled={pass < 4}
              className="py-3 px-4 rounded-xl bg-[#faf2ed] text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:3px_3px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Hardware Print</span>
            </button>

            <button
              onClick={onDownloadHD}
              className="py-3 px-4 rounded-xl bg-[#db3320] text-white font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:3px_3px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Download 300DPI Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
