import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilterType } from '../types';
import { playBeep, playShutterSound } from '../utils/audio';
import { DEMO_PHOTO_URL } from '../utils/stamps';

interface PhotoboothCameraProps {
  onPhotoCaptured: (photoUrl: string, stripPhotos?: string[]) => void;
  onCancel?: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onOpenLiveCoach?: () => void;
}

export const PhotoboothCamera: React.FC<PhotoboothCameraProps> = ({
  onPhotoCaptured,
  onCancel,
  activeFilter,
  onFilterChange,
  onOpenLiveCoach,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [timerSeconds, setTimerSeconds] = useState<number>(3); // 0, 3, 5
  const [countingDown, setCountingDown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isBurstMode, setIsBurstMode] = useState(false);
  const [burstPhotos, setBurstPhotos] = useState<string[]>([]);
  const [burstStep, setBurstStep] = useState<number>(0);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not available. You can upload a photo or use the Arcade Demo photo below!');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Capture single frame from video
  const captureFrame = useCallback((): string => {
    if (!videoRef.current) return DEMO_PHOTO_URL;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return DEMO_PHOTO_URL;

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isMirrored]);

  // Flash & Shutter audio
  const triggerShutterEffect = () => {
    playShutterSound();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 240);
  };

  // Handle capture trigger
  const handleShutterClick = () => {
    if (countingDown !== null) return;

    if (timerSeconds === 0) {
      executeCaptureSequence();
    } else {
      let count = timerSeconds;
      setCountingDown(count);
      playBeep(800, 0.1);

      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountingDown(count);
          playBeep(800, 0.1);
        } else {
          clearInterval(interval);
          setCountingDown(null);
          executeCaptureSequence();
        }
      }, 1000);
    }
  };

  const executeCaptureSequence = async () => {
    if (!isBurstMode) {
      triggerShutterEffect();
      const photo = captureFrame();
      setTimeout(() => {
        onPhotoCaptured(photo);
      }, 350);
    } else {
      // 3-shot burst
      const photos: string[] = [];
      for (let i = 1; i <= 3; i++) {
        setBurstStep(i);
        playBeep(1200, 0.15);
        triggerShutterEffect();
        const photo = captureFrame();
        photos.push(photo);
        setBurstPhotos([...photos]);
        if (i < 3) {
          await new Promise((res) => setTimeout(res, 1200));
        }
      }
      setTimeout(() => {
        onPhotoCaptured(photos[0], photos);
      }, 400);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          triggerShutterEffect();
          onPhotoCaptured(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemo = () => {
    triggerShutterEffect();
    onPhotoCaptured(DEMO_PHOTO_URL);
  };

  return (
    <div className="min-h-screen bg-[#1e1b18] text-[#fff8f4] flex flex-col justify-between select-none relative overflow-hidden pb-12">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Screen Shutter Flash */}
      <div
        className={`fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200 ${
          isFlashing ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* Top Photobooth Canopy */}
      <header className="px-4 py-3 bg-[#b71607] border-b-4 border-[#1e1b18] [box-shadow:0px_4px_0px_#000] flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-2.5 py-1 text-xs font-bold uppercase rounded border-2 border-[#1e1b18] bg-[#faf2ed] text-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Back
            </button>
          )}
          <span className="font-headline text-lg sm:text-xl font-black uppercase tracking-wider text-[#fec736]">
            Arcade Lane • Booth #04
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLiveCoach && (
            <button
              onClick={onOpenLiveCoach}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#fec736] text-[#1e1b18] rounded-lg font-label text-xs font-black uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer hover:bg-amber-300"
              title="Talk to Live Attendant powered by gemini-3.8-live"
            >
              <span className="text-[14px]">🎙️</span>
              <span className="hidden sm:inline">Attendant (Live API)</span>
              <span className="sm:hidden">Live Voice</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e1b18] text-[#fec736] rounded font-label text-xs font-bold border border-[#fec736]/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ON AIR
          </span>
        </div>
      </header>

      {/* Main Viewfinder Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-2xl mx-auto w-full relative">
        {/* Retro Wooden / Metal Booth Frame */}
        <div className="relative w-full max-w-md aspect-[3/4] bg-[#2a2420] rounded-2xl border-4 border-[#1e1b18] p-2.5 [box-shadow:6px_6px_0px_#000000] overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle curtain edges */}
          <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-[#701008] to-transparent z-10 pointer-events-none opacity-80" />
          <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-[#701008] to-transparent z-10 pointer-events-none opacity-80" />

          {/* Video or Fallback Canvas */}
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#111] flex items-center justify-center border-2 border-[#1e1b18]">
            {cameraError ? (
              <div className="p-6 text-center space-y-4">
                <span className="material-symbols-outlined text-4xl text-[#fec736]">
                  videocam_off
                </span>
                <p className="text-sm font-label text-[#faf2ed]/90">{cameraError}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-4 bg-[#fec736] text-[#1e1b18] font-bold text-xs uppercase rounded-lg border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    📁 Upload Your Photo
                  </button>
                  <button
                    onClick={handleUseDemo}
                    className="py-2.5 px-4 bg-[#faf2ed] text-[#1e1b18] font-bold text-xs uppercase rounded-lg border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    ✨ Use Booth Friends Sample
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover filter-${activeFilter} ${
                  isMirrored ? 'scale-x-[-1]' : ''
                }`}
              />
            )}

            {/* Countdown Overlay Display */}
            {countingDown !== null && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-30 animate-pulse">
                <span className="font-headline text-8xl font-black text-[#fec736] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  {countingDown}
                </span>
              </div>
            )}

            {/* Burst Step Indicator */}
            {burstStep > 0 && (
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#b71607] text-white text-xs font-bold uppercase rounded border border-white">
                Shot {burstStep} of 3
              </div>
            )}

            {/* Viewfinder Reticle */}
            <div className="absolute inset-6 border border-white/30 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] font-label text-white/70">
                <span>[ + ]</span>
                <span className="uppercase">BOOTH #04</span>
                <span>[ + ]</span>
              </div>
              <div className="flex justify-between text-[10px] font-label text-white/70">
                <span>4×6 POSTCARD</span>
                <span>READY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Filter Strip under Viewfinder */}
        <div className="w-full max-w-md mt-4 flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 bg-[#2a2420] border-2 border-[#1e1b18] rounded-xl">
          {[
            { id: 'golden', label: "'70s Golden" },
            { id: 'bw', label: 'B&W Film' },
            { id: 'pastel', label: 'Pastel Dream' },
            { id: 'kodak', label: 'Kodak 800' },
            { id: 'flash', label: 'Vivid Flash' },
            { id: 'none', label: 'Clean' },
          ].map((filt) => (
            <button
              key={filt.id}
              onClick={() => onFilterChange(filt.id as FilterType)}
              className={`px-2.5 py-1 text-[11px] font-label font-bold rounded-lg border whitespace-nowrap transition-all ${
                activeFilter === filt.id
                  ? 'bg-[#fec736] text-[#1e1b18] border-[#1e1b18] [box-shadow:1px_1px_0px_#000]'
                  : 'bg-[#1e1b18] text-[#faf2ed]/80 border-white/10 hover:border-white/40'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </main>

      {/* Photobooth Bottom Arcade Control Deck */}
      <footer className="w-full max-w-xl mx-auto px-4 z-20">
        <div className="bg-[#2a2420] border-3 border-[#1e1b18] rounded-2xl p-3 sm:p-4 [box-shadow:4px_4px_0px_#000000] flex flex-col gap-3">
          {/* Quick Aux Controls */}
          <div className="flex items-center justify-between text-xs font-label">
            {/* Mirror / Flip */}
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e1b18] text-[#faf2ed] border border-white/20 active:translate-x-[1px]"
              title="Mirror Viewfinder"
            >
              <span className="material-symbols-outlined text-[16px]">flip</span>
              <span>{isMirrored ? 'Mirrored' : 'Normal'}</span>
            </button>

            {/* Timer Toggle */}
            <div className="flex items-center gap-1 bg-[#1e1b18] p-1 rounded-lg border border-white/20">
              <span className="material-symbols-outlined text-[14px] text-[#fec736] ml-1">timer</span>
              {[0, 3, 5].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTimerSeconds(sec)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    timerSeconds === sec
                      ? 'bg-[#fec736] text-[#1e1b18]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>

            {/* Switch Camera if supported */}
            <button
              onClick={() => {
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e1b18] text-[#faf2ed] border border-white/20"
              title="Switch Front/Rear Camera"
            >
              <span className="material-symbols-outlined text-[16px]">cameraswitch</span>
              <span>Flip</span>
            </button>
          </div>

          {/* Primary Giant Arcade Shutter Button & Upload Alternative */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-3 rounded-xl bg-[#faf2ed] text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload Photo</span>
            </button>

            {/* Big Arcade Shutter */}
            <button
              onClick={handleShutterClick}
              disabled={countingDown !== null}
              className="flex-[2] py-4 px-6 rounded-2xl bg-gradient-to-b from-[#db3320] to-[#b71607] text-white font-headline text-lg sm:text-xl font-black uppercase tracking-wider border-3 border-[#1e1b18] [box-shadow:0px_6px_0px_#701008,3px_8px_0px_#000] active:translate-y-[4px] active:[box-shadow:0px_2px_0px_#701008,1px_3px_0px_#000] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                photo_camera
              </span>
              <span>CAPTURE SNAP</span>
            </button>

            <button
              onClick={handleUseDemo}
              className="flex-1 py-3 px-3 rounded-xl bg-[#fec736] text-[#1e1b18] font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1"
              title="Load the 4 friends booth sample photo"
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Demo Crew</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
