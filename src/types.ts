export type FilterType = 
  | 'golden'
  | 'bw'
  | 'pastel'
  | 'kodak'
  | 'flash'
  | 'cyan'
  | 'sepia'
  | 'analog'
  | 'none';

export type BorderType = 'classic' | 'gold' | 'mint' | 'coral' | 'noir';

export interface StickerItem {
  id: string;
  label: string;
  variant: 'badge' | 'stamp' | 'emoji' | 'banner';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  color?: string;
  bgColor?: string;
}

export interface PostageStamp {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  denomination: string;
}

export interface PostcardData {
  id: string;
  timestamp: number;
  photoUrl: string;
  stripPhotos?: string[];
  isStripMode?: boolean;
  filter: FilterType;
  border: BorderType;
  stampWatermark: string;
  chinDateText: string;
  chinHandwrittenText: string;
  cancellationTitle: string;
  cancellationLocation: string;
  cancellationDate: string;
  stampId: string;
  noteText: string;
  recipientTo: string;
  recipientAt: string;
  stickers: StickerItem[];
  washiColor: string;
}
