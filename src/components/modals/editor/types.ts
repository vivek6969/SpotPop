import {
  ProductTier,
  SpotShape,
  FrameStyle,
  StickerItem,
  SpotLayer,
  PhotoAdjustments,
  BlendMode,
  SpotAudio,
} from '../../../types';

export interface AudioDraft {
  blob: Blob;
  previewUrl: string;
  duration: number; // in seconds
  mimeType: string;
  size: number;     // in bytes
  type: 'voice' | 'music';
  filename?: string;
}

export type BrushStyle =
  | 'neon'
  | 'calligraphy'
  | 'graffiti'
  | 'watercolor'
  | 'pen'
  | 'rainbow'
  | 'highlighter'
  | 'pencil'
  | 'eraser';

export interface PlanDraft {
  headline: string;
  headlineX?: number;
  headlineY?: number;
  secondaryText: string;
  subtextX?: number;
  subtextY?: number;
  subtextSize?: number;
  creatorName: string;
  authorX?: number;
  authorY?: number;
  authorSize?: number;
  authorOpacity?: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  textOpacity: number;
  alignment: 'left' | 'center' | 'right';
  backgroundColor: string;
  frameStyle: FrameStyle;
  shape: SpotShape;
  stickers: StickerItem[];
  imageUrl?: string;
  photoOpacity?: number;
  photoZoom?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  drawingDataUrl?: string | null;
  drawingOpacity?: number;
  photoAdjustments?: PhotoAdjustments;
  layers?: SpotLayer[];
  isCurvedText?: boolean;
  curveRadius?: number;
  circularText?: boolean;
  textStroke?: string;
  textGlow?: string;
  text3D?: boolean;
  textGradient?: string;
  badgeColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  customFontUrl?: string;
  audioDraft?: AudioDraft | null;
  audio?: SpotAudio | null;
}

export interface ShapeOption {
  id: SpotShape;
  name: string;
  icon: string;
  desc: string;
  badge?: string;
  defaultBg?: string;
}

export interface BackgroundOption {
  name: string;
  value: string;
  text: string;
  category: 'halloween' | 'christmas' | 'love' | 'retro' | 'classic';
}

