import React, { useState, useRef } from 'react';
import { AudioVoiceRecorder, transcribeAudioBlob } from '../utils/transcribe';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteText: string;
  recipientTo: string;
  recipientAt: string;
  chinDateText: string;
  chinHandwrittenText: string;
  onSave: (data: {
    noteText: string;
    recipientTo: string;
    recipientAt: string;
    chinDateText: string;
    chinHandwrittenText: string;
  }) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  noteText,
  recipientTo,
  recipientAt,
  chinDateText,
  chinHandwrittenText,
  onSave,
}) => {
  const [formNote, setFormNote] = useState(noteText);
  const [formTo, setFormTo] = useState(recipientTo);
  const [formAt, setFormAt] = useState(recipientAt);
  const [formChinDate, setFormChinDate] = useState(chinDateText);
  const [formChinHandwrite, setFormChinHandwrite] = useState(chinHandwrittenText);

  // Audio transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const recorderRef = useRef<AudioVoiceRecorder | null>(null);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    try {
      setTranscribeError(null);
      recorderRef.current = new AudioVoiceRecorder();
      await recorderRef.current.startRecording();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      setTranscribeError('Microphone access was denied or is not supported.');
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    setIsRecording(false);
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const audioBlob = await recorderRef.current.stopRecording();
      const transcription = await transcribeAudioBlob(audioBlob);
      if (transcription) {
        setFormNote(transcription);
      } else {
        setTranscribeError('No spoken words were detected in the audio.');
      }
    } catch (err: unknown) {
      console.error('Transcription error:', err);
      setTranscribeError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      noteText: formNote,
      recipientTo: formTo,
      recipientAt: formAt,
      chinDateText: formChinDate,
      chinHandwrittenText: formChinHandwrite,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#faf2ed] border-3 border-[#1e1b18] rounded-2xl w-full max-w-lg overflow-hidden [box-shadow:6px_6px_0px_#1e1b18] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1e1b18] text-[#fff8f4] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fec736]">edit_note</span>
            <h3 className="font-headline text-base font-bold uppercase tracking-wide text-[#fec736]">
              Edit Postcard Inscription
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#2a2420] text-white border border-white/20 flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="block font-label text-xs font-bold uppercase text-[#5c403b]">
                Handwritten Note (in cursive)
              </label>

              {/* Transcribe audio button using gemini-3.5-transcribe */}
              <div className="flex items-center gap-1.5">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#db3320] text-white rounded-full font-label text-[11px] font-bold uppercase animate-pulse border border-[#1e1b18] shadow cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Stop & Transcribe</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isTranscribing}
                    onClick={handleStartRecording}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#ffdf9a] text-[#5a4300] hover:bg-[#fec736] rounded-full font-label text-[11px] font-bold uppercase border border-[#1e1b18] transition-all cursor-pointer disabled:opacity-60"
                    title="Speak into your microphone and transcribe using gemini-3.5-transcribe"
                  >
                    <span className="material-symbols-outlined text-[14px]">mic</span>
                    <span>{isTranscribing ? 'Transcribing...' : 'Dictate with Mic'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Transcription Status Banner */}
            {isRecording && (
              <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2 text-xs font-label text-red-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span>Recording your voice... Click "Stop & Transcribe" when finished speaking.</span>
              </div>
            )}

            {isTranscribing && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2 text-xs font-label text-amber-900">
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Transcribing audio with <strong>gemini-3.5-transcribe</strong>...</span>
              </div>
            )}

            {transcribeError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-label text-red-700">
                ⚠️ {transcribeError}
              </div>
            )}

            <textarea
              rows={3}
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Best night ever with the crew! ✨ Don't forget this moment."
              className="w-full p-3 font-handwrite text-2xl bg-white border-2 border-[#1e1b18] rounded-xl [box-shadow:inset_2px_2px_0px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#db3320] text-[#1e1b18]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-label text-xs font-bold uppercase text-[#5c403b] mb-1">
                To: (Recipient)
              </label>
              <input
                type="text"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
                placeholder="The Best Friends Forever"
                className="w-full p-2.5 font-label text-sm bg-white border-2 border-[#1e1b18] rounded-lg [box-shadow:inset_2px_2px_0px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#db3320]"
              />
            </div>

            <div>
              <label className="block font-label text-xs font-bold uppercase text-[#5c403b] mb-1">
                At: (Location / Booth)
              </label>
              <input
                type="text"
                value={formAt}
                onChange={(e) => setFormAt(e.target.value)}
                placeholder="Arcade Lane, Booth #04"
                className="w-full p-2.5 font-label text-sm bg-white border-2 border-[#1e1b18] rounded-lg [box-shadow:inset_2px_2px_0px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#db3320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-black/10">
            <div>
              <label className="block font-label text-[11px] font-bold uppercase text-[#5c403b] mb-1">
                Polaroid Stamp Date
              </label>
              <input
                type="text"
                value={formChinDate}
                onChange={(e) => setFormChinDate(e.target.value)}
                placeholder="JULY 24 • BOOTH #04"
                className="w-full p-2 font-label text-xs bg-white border border-[#1e1b18] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-label text-[11px] font-bold uppercase text-[#5c403b] mb-1">
                Polaroid Chin Cursive
              </label>
              <input
                type="text"
                value={formChinHandwrite}
                onChange={(e) => setFormChinHandwrite(e.target.value)}
                placeholder="smiles forever ♡"
                className="w-full p-2 font-handwrite text-xl text-[#b71607] bg-white border border-[#1e1b18] rounded-lg"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-[#eee7e1] text-[#1e1b18] font-label font-bold text-xs uppercase border border-[#1e1b18] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-lg bg-[#db3320] text-white font-label font-bold text-xs uppercase border-2 border-[#1e1b18] [box-shadow:2px_2px_0px_#1e1b18] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              Update Postcard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

