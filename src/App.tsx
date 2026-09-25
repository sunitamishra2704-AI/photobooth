import { useState, useEffect, useCallback } from 'react';
import { PostcardData, FilterType } from './types';
import { DEMO_PHOTO_URL } from './utils/stamps';
import { generatePostcardHD } from './utils/exportPostcard';
import { PhotoboothCamera } from './components/PhotoboothCamera';
import { PostcardStudio } from './components/PostcardStudio';
import { PrintSimulationModal } from './components/PrintSimulationModal';
import { ShareModal } from './components/ShareModal';
import { PhotoRollDrawer } from './components/PhotoRollDrawer';
import { StampSelectorModal } from './components/StampSelectorModal';
import { EditNoteModal } from './components/EditNoteModal';
import { LiveVoiceCoachModal } from './components/LiveVoiceCoachModal';

const INITIAL_POSTCARD: PostcardData = {
  id: 'default-card-04',
  timestamp: Date.now(),
  photoUrl: DEMO_PHOTO_URL,
  filter: 'golden',
  border: 'classic',
  stampWatermark: 'BOOTH #04',
  chinDateText: 'JULY 24 • BOOTH #04',
  chinHandwrittenText: 'smiles forever ♡',
  cancellationTitle: 'AIR MAIL • EXPRESS',
  cancellationLocation: 'LOS ANGELES, CA',
  cancellationDate: 'JUL 24 • 1974 • POSTED',
  stampId: 'palm-springs-1974',
  noteText: 'Best night ever with the crew! ✨ Don’t forget this moment.',
  recipientTo: 'The Best Friends Forever',
  recipientAt: 'Arcade Lane, Booth #04',
  stickers: [],
  washiColor: '#ffdf9a',
};

export default function App() {
  const [currentView, setCurrentView] = useState<'studio' | 'booth'>('studio');
  const [postcardData, setPostcardData] = useState<PostcardData>(() => {
    try {
      const saved = localStorage.getItem('postcard_current_data');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_POSTCARD;
  });

  const [savedRoll, setSavedRoll] = useState<PostcardData[]>(() => {
    try {
      const saved = localStorage.getItem('postcard_saved_roll');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [INITIAL_POSTCARD];
  });

  // Modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRollDrawerOpen, setIsRollDrawerOpen] = useState(false);
  const [isStampSelectorOpen, setIsStampSelectorOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [isLiveCoachOpen, setIsLiveCoachOpen] = useState(false);
  const [renderedHDUrl, setRenderedHDUrl] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('postcard_current_data', JSON.stringify(postcardData));
    } catch {
      // ignore
    }
  }, [postcardData]);

  useEffect(() => {
    try {
      localStorage.setItem('postcard_saved_roll', JSON.stringify(savedRoll));
    } catch {
      // ignore
    }
  }, [savedRoll]);

  // Pre-render HD preview when entering studio or changing data
  const renderHD = useCallback(async () => {
    try {
      const url = await generatePostcardHD(postcardData);
      setRenderedHDUrl(url);
      return url;
    } catch (err) {
      console.warn('Failed to pre-render HD postcard:', err);
      return null;
    }
  }, [postcardData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderHD();
    }, 300);
    return () => clearTimeout(timer);
  }, [renderHD]);

  // Handling camera capture
  const handlePhotoCaptured = (photoUrl: string) => {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[now.getMonth()];
    const dateStr = `${month} ${now.getDate()} • BOOTH #04`;

    const updatedCard: PostcardData = {
      ...postcardData,
      id: `card-${Date.now()}`,
      timestamp: Date.now(),
      photoUrl,
      chinDateText: dateStr,
    };

    setPostcardData(updatedCard);
    setSavedRoll((prev) => [updatedCard, ...prev.filter((c) => c.id !== updatedCard.id)]);
    setCurrentView('studio');
  };

  // Download HD function
  const handleExportHD = async () => {
    let url = renderedHDUrl;
    if (!url) {
      url = await generatePostcardHD(postcardData);
      setRenderedHDUrl(url);
    }
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `postcard-studio-booth04-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePrintClick = async () => {
    if (!renderedHDUrl) {
      await renderHD();
    }
    setIsPrintModalOpen(true);
  };

  const handleSaveToRoll = () => {
    setSavedRoll((prev) => {
      const exists = prev.some((c) => c.id === postcardData.id);
      if (exists) {
        return prev.map((c) => (c.id === postcardData.id ? postcardData : c));
      }
      return [postcardData, ...prev];
    });
    setIsRollDrawerOpen(true);
  };

  const handleDeleteCardFromRoll = (id: string) => {
    setSavedRoll((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSelectCardFromRoll = (card: PostcardData) => {
    setPostcardData(card);
  };

  return (
    <div className="min-h-screen bg-[#fff8f4]">
      {currentView === 'booth' ? (
        <PhotoboothCamera
          onPhotoCaptured={handlePhotoCaptured}
          onCancel={() => setCurrentView('studio')}
          activeFilter={postcardData.filter}
          onFilterChange={(filter: FilterType) =>
            setPostcardData((prev) => ({ ...prev, filter }))
          }
          onOpenLiveCoach={() => setIsLiveCoachOpen(true)}
        />
      ) : (
        <PostcardStudio
          data={postcardData}
          onChangeData={setPostcardData}
          onRetake={() => setCurrentView('booth')}
          onExportHD={handleExportHD}
          onPrint={handlePrintClick}
          onShare={() => setIsShareModalOpen(true)}
          onOpenRoll={handleSaveToRoll}
          onOpenStampSelector={() => setIsStampSelectorOpen(true)}
          onOpenEditNote={() => setIsEditNoteOpen(true)}
          onOpenLiveCoach={() => setIsLiveCoachOpen(true)}
          savedRollCount={savedRoll.length}
        />
      )}

      {/* Print Thermal Simulation Modal */}
      <PrintSimulationModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        renderedImageUrl={renderedHDUrl}
        onDownloadHD={handleExportHD}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        renderedImageUrl={renderedHDUrl}
        onDownload={handleExportHD}
      />

      {/* Photo Roll Drawer */}
      <PhotoRollDrawer
        isOpen={isRollDrawerOpen}
        onClose={() => setIsRollDrawerOpen(false)}
        savedRoll={savedRoll}
        onSelectCard={handleSelectCardFromRoll}
        onDeleteCard={handleDeleteCardFromRoll}
      />

      {/* Stamp Selector Modal */}
      <StampSelectorModal
        isOpen={isStampSelectorOpen}
        onClose={() => setIsStampSelectorOpen(false)}
        selectedStampId={postcardData.stampId}
        onSelectStamp={(stampId) =>
          setPostcardData((prev) => ({ ...prev, stampId }))
        }
      />

      {/* Edit Note Modal */}
      <EditNoteModal
        isOpen={isEditNoteOpen}
        onClose={() => setIsEditNoteOpen(false)}
        noteText={postcardData.noteText}
        recipientTo={postcardData.recipientTo}
        recipientAt={postcardData.recipientAt}
        chinDateText={postcardData.chinDateText}
        chinHandwrittenText={postcardData.chinHandwrittenText}
        onSave={({ noteText, recipientTo, recipientAt, chinDateText, chinHandwrittenText }) => {
          setPostcardData((prev) => ({
            ...prev,
            noteText,
            recipientTo,
            recipientAt,
            chinDateText,
            chinHandwrittenText,
          }));
        }}
      />

      {/* Live Voice Coach Intercom Modal (gemini-3.8-live) */}
      <LiveVoiceCoachModal
        isOpen={isLiveCoachOpen}
        onClose={() => setIsLiveCoachOpen(false)}
        onApplyNoteText={(noteText) =>
          setPostcardData((prev) => ({
            ...prev,
            noteText,
          }))
        }
      />
    </div>
  );
}
