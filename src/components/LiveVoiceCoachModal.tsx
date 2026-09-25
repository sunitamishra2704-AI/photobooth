import React, { useEffect, useRef } from 'react';
import { useLiveVoice } from '../utils/useLiveVoice';

interface LiveVoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNoteText?: (text: string) => void;
}

export const LiveVoiceCoachModal: React.FC<LiveVoiceCoachModalProps> = ({
  isOpen,
  onClose,
  onApplyNoteText,
}) => {
  const {
    isConnected,
    isConnecting,
    isModelSpeaking,
    userTranscript,
    modelTranscript,
    messages,
    micVolume,
    error,
    connect,
    disconnect,
    sendTextMessage,
  } = useLiveVoice();

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto connect when opened
  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting) {
      connect();
    } else if (!isOpen && isConnected) {
      disconnect();
    }
  }, [isOpen, isConnected, isConnecting, connect, disconnect]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userTranscript, modelTranscript]);

  if (!isOpen) return null;

  const handleQuickPrompt = (prompt: string) => {
    sendTextMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#faf2ed] border-3 border-[#1e1b18] rounded-2xl w-full max-w-lg h-[90vh] max-h-[680px] flex flex-col overflow-hidden [box-shadow:8px_8px_0px_#1e1b18] animate-in zoom-in-95 duration-150">
        {/* Retro Intercom Header */}
        <div className="bg-[#b71607] text-white p-3.5 border-b-3 border-[#1e1b18] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1e1b18] border-2 border-white/30 flex items-center justify-center text-xl shadow-inner">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-base sm:text-lg font-bold uppercase tracking-wider text-[#fec736]">
                  Booth Attendant (Live)
                </h3>
                <span className="bg-[#1e1b18] text-[#fec736] text-[9px] font-label font-bold px-2 py-0.5 rounded border border-[#fec736]/40 uppercase">
                  gemini-3.8-live
                </span>
              </div>
              <p className="font-label text-[10px] text-white/80 uppercase">
                Real-Time Voice Assistant & Photo Director
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              disconnect();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#1e1b18] text-white border border-white/30 flex items-center justify-center hover:bg-black/60 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Vintage Radio Speaker Grill & Status Bar */}
        <div className="bg-[#1e1b18] text-[#faf2ed] p-3 border-b-2 border-[#1e1b18] flex items-center justify-between gap-3">
          {/* Connection state */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              )}
            </span>
            <span className="font-label text-xs font-bold uppercase tracking-wide">
              {isConnecting
                ? 'Connecting to Live API...'
                : isConnected
                ? isModelSpeaking
                  ? 'Attendant is Speaking...'
                  : 'Listening to your voice...'
                : 'Disconnected'}
            </span>
          </div>

          {/* Analog VU Audio Meter */}
          <div className="flex items-center gap-1 bg-[#2a2420] px-2.5 py-1 rounded border border-white/20">
            <span className="text-[10px] font-label text-[#fec736] uppercase font-bold mr-1">VU</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((lvl, idx) => (
              <span
                key={idx}
                className="w-1.5 h-3.5 rounded-xs transition-all duration-75"
                style={{
                  backgroundColor:
                    micVolume >= lvl
                      ? lvl > 0.6
                        ? '#db3320'
                        : '#fec736'
                      : '#443b35',
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Conversation Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf2ed] paper-grain">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-800 text-xs font-label">
              ⚠️ {error}
            </div>
          )}

          {messages.length === 0 && !userTranscript && !modelTranscript && (
            <div className="text-center py-6 space-y-3 text-[#5c403b]">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#fec736]/40 border-2 border-[#1e1b18] flex items-center justify-center text-3xl">
                📻
              </div>
              <p className="font-headline text-base font-bold text-[#1e1b18]">
                "Welcome to Booth #04! How can I help your shoot today?"
              </p>
              <p className="font-label text-xs max-w-sm mx-auto">
                Speak freely into your microphone. You can ask for pose ideas, retro filter picks, or romantic/fun postcard inscriptions!
              </p>
            </div>
          )}

          {/* History messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 border-2 border-[#1e1b18] text-sm [box-shadow:2px_2px_0px_#1e1b18] ${
                  msg.sender === 'user'
                    ? 'bg-[#fec736] text-[#1e1b18]'
                    : 'bg-white text-[#1e1b18]'
                }`}
              >
                <span className="font-label text-[10px] font-bold uppercase tracking-wider block opacity-60 mb-0.5">
                  {msg.sender === 'user' ? 'You' : 'Booth Attendant'}
                </span>
                <p className="leading-snug">{msg.text}</p>

                {/* If model gives text that could be an inscription, let user apply it */}
                {msg.sender === 'model' && onApplyNoteText && msg.text.length < 120 && (
                  <button
                    onClick={() => {
                      onApplyNoteText(msg.text.replace(/^"|"$/g, ''));
                      onClose();
                    }}
                    className="mt-2 py-1 px-2.5 bg-[#db3320] text-white rounded text-[10px] font-label font-bold uppercase hover:bg-red-700 cursor-pointer"
                  >
                    ✎ Use As Postcard Note
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Active Streaming Transcripts */}
          {userTranscript && (
            <div className="flex flex-col items-end">
              <div className="max-w-[85%] rounded-2xl p-3 border-2 border-dashed border-[#1e1b18] bg-[#fec736]/70 text-[#1e1b18] text-sm animate-pulse">
                <span className="font-label text-[10px] font-bold uppercase block opacity-60">
                  You (Speaking...)
                </span>
                <p>{userTranscript}</p>
              </div>
            </div>
          )}

          {modelTranscript && (
            <div className="flex flex-col items-start">
              <div className="max-w-[85%] rounded-2xl p-3 border-2 border-dashed border-[#1e1b18] bg-white text-[#1e1b18] text-sm animate-pulse">
                <span className="font-label text-[10px] font-bold uppercase block text-[#b71607]">
                  Attendant (Responding...)
                </span>
                <p>{modelTranscript}</p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-[#eee7e1] border-t-2 border-[#1e1b18] overflow-x-auto flex gap-1.5 shrink-0">
          {[
            'Give us a fun 70s photobooth pose!',
            'Which filter should we use for our photo?',
            'Suggest a sweet postcard note for friends',
            'Count down for our next photo snapshot',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="py-1 px-2.5 rounded-full bg-white border border-[#1e1b18] text-[11px] font-label font-semibold text-[#1e1b18] whitespace-nowrap hover:bg-[#fec736] active:scale-95 transition-all cursor-pointer"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-3 bg-[#1e1b18] border-t-2 border-[#1e1b18] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white text-xs font-label">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Microphone active • Hands-free Live mode</span>
          </div>

          <button
            onClick={() => {
              if (isConnected) {
                disconnect();
              } else {
                connect();
              }
            }}
            className={`py-2 px-4 rounded-xl font-label text-xs font-bold uppercase border-2 border-white/40 cursor-pointer ${
              isConnected
                ? 'bg-[#db3320] text-white hover:bg-red-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isConnected ? 'Mute & Pause' : 'Reconnect Live'}
          </button>
        </div>
      </div>
    </div>
  );
};
