import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ProductTier, PRODUCTS, Spot, SpotShape, FrameStyle, StickerItem, SpotLayer, PhotoAdjustments, BlendMode } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';
import { PhotoCropTab } from './editor/PhotoCropTab';
import { AdjustTab } from './editor/AdjustTab';
import { RetouchTab } from './editor/RetouchTab';
import { TextStudioTab } from './editor/TextStudioTab';
import { StickersStockTab } from './editor/StickersStockTab';
import { DrawStudioTab } from './editor/DrawStudioTab';
import { FramesTab } from './editor/FramesTab';
import { ThemesTab } from './editor/ThemesTab';
import { BrushStyle, PlanDraft } from './editor/types';
import {
  FILTER_PRESETS,
  EFFECT_PRESETS,
  CURVE_PRESETS,
  loadGoogleFont,
  speakText,
} from '../../utils/photoFilters';

export type { BrushStyle, PlanDraft };

interface CreateSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier: ProductTier;
  onSuccess: (newSpot: Spot) => void;
}

// =================== FONTS ===================
export const ALL_FONTS = [
  // Handwritten
  { id: 'Caveat', name: 'Caveat (Casual Handwriting)', family: "'Caveat', cursive", category: 'Handwritten' },
  { id: 'Dancing Script', name: 'Dancing Script (Calligraphy)', family: "'Dancing Script', cursive", category: 'Handwritten' },
  { id: 'Pacifico', name: 'Pacifico (Brush Script)', family: "'Pacifico', cursive", category: 'Handwritten' },
  { id: 'Shadows Into Light', name: 'Shadows Into Light (Doodle)', family: "'Shadows Into Light', cursive", category: 'Handwritten' },
  { id: 'Gloria Hallelujah', name: 'Gloria Hallelujah (Blackboard)', family: "'Gloria Hallelujah', cursive", category: 'Handwritten' },
  { id: 'Kalam', name: 'Kalam (Marker Pen)', family: "'Kalam', cursive", category: 'Handwritten' },
  { id: 'Satisfy', name: 'Satisfy (Smooth Ink)', family: "'Satisfy', cursive", category: 'Handwritten' },
  { id: 'Sacramento', name: 'Sacramento (Fine Ribbon)', family: "'Sacramento', cursive", category: 'Handwritten' },

  // Modern
  { id: 'Outfit', name: 'Outfit (Modern Bold Sans)', family: "'Outfit', sans-serif", category: 'Modern' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Clean Minimal)', family: "'Plus Jakarta Sans', sans-serif", category: 'Modern' },
  { id: 'Fredoka', name: 'Fredoka (Cute Bubble Sans)', family: "'Fredoka', sans-serif", category: 'Modern' },
  { id: 'Comfortaa', name: 'Comfortaa (Soft Geometric)', family: "'Comfortaa', cursive", category: 'Modern' },
  { id: 'Inter', name: 'Inter (Precision Clean)', family: "'Inter', sans-serif", category: 'Modern' },
  { id: 'Poppins', name: 'Poppins (Geometric Pop)', family: "'Poppins', sans-serif", category: 'Modern' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech Neo)', family: "'Space Grotesk', sans-serif", category: 'Modern' },

  // Display
  { id: 'Permanent Marker', name: 'Permanent Marker (Graffiti Tag)', family: "'Permanent Marker', cursive", category: 'Display' },
  { id: 'Bungee', name: 'Bungee (Urban Signage)', family: "'Bungee', cursive", category: 'Display' },
  { id: 'Bebas Neue', name: 'Bebas Neue (Bold Impact)', family: "'Bebas Neue', cursive", category: 'Display' },
  { id: 'Righteous', name: 'Righteous (Deco Modern)', family: "'Righteous', cursive", category: 'Display' },
  { id: 'Shrikhand', name: 'Shrikhand (Retro Poster)', family: "'Shrikhand', cursive", category: 'Display' },
  { id: 'Bangers', name: 'Bangers (Comic Hero)', family: "'Bangers', cursive", category: 'Display' },
  { id: 'Creepster', name: 'Creepster (Spooky Horror)', family: "'Creepster', cursive", category: 'Display' },

  // Retro
  { id: 'Press Start 2P', name: 'Press Start 2P (8-Bit Arcade)', family: "'Press Start 2P', monospace", category: 'Retro' },
  { id: 'Space Mono', name: 'Space Mono (Cyber Tech)', family: "'Space Mono', monospace", category: 'Retro' },
  { id: 'VT323', name: 'VT323 (Retro Terminal)', family: "'VT323', monospace", category: 'Retro' },
  { id: 'Silkscreen', name: 'Silkscreen (Pixel Crisp)', family: "'Silkscreen', monospace", category: 'Retro' },

  // Serif
  { id: 'Playfair Display', name: 'Playfair Display (Editorial Luxury)', family: "'Playfair Display', serif", category: 'Serif' },
  { id: 'Cinzel', name: 'Cinzel (Roman Classical)', family: "'Cinzel', serif", category: 'Serif' },
  { id: 'Abril Fatface', name: 'Abril Fatface (High-Fashion Title)', family: "'Abril Fatface', cursive", category: 'Serif' },
  { id: 'Cormorant Garamond', name: 'Cormorant Garamond (Fine Literature)', family: "'Cormorant Garamond', serif", category: 'Serif' },
  { id: 'DM Serif Display', name: 'DM Serif (Modern Editorial)', family: "'DM Serif Display', serif", category: 'Serif' },
];

// =================== CARD SHAPES & FRAMES ===================
export interface ShapeOption {
  id: SpotShape;
  name: string;
  icon: string;
  desc: string;
  badge?: string;
  defaultBg?: string;
}

export const AVAILABLE_SHAPES: ShapeOption[] = [
  {
    id: 'transparent',
    name: 'Transparent Cutout (PNG Only)',
    icon: '🌟',
    desc: 'Remove sticky note completely! Uploaded PNG image, stickers & doodles float freely on the wall.',
    badge: 'PNG Cutout',
    defaultBg: 'transparent',
  },
  {
    id: 'polaroid',
    name: 'Classic Polaroid',
    icon: '📸',
    desc: 'Vintage instant photo frame with signature caption bottom.',
    badge: 'Instant',
    defaultBg: '#FFFFFF',
  },
  {
    id: 'frameless',
    name: 'Full-Bleed Frameless',
    icon: '🖼️',
    desc: 'Edge-to-edge artwork with sleek modern rounded corners.',
    badge: 'Poster',
    defaultBg: 'linear-gradient(135deg, #1E1B4B, #3B0764)',
  },
  {
    id: 'glass',
    name: 'Frosted Neon Glass',
    icon: '🪞',
    desc: 'Ultra-modern translucent acrylic with iridescent glowing rim.',
    badge: 'Acrylic',
    defaultBg: 'rgba(255, 255, 255, 0.12)',
  },
  {
    id: 'gold',
    name: 'Gold Museum Frame',
    icon: '👑',
    desc: 'Luxurious baroque gold bordered art gallery picture frame.',
    badge: 'Baroque',
    defaultBg: '#1A1A24',
  },
  {
    id: 'comic',
    name: 'Pop Art Comic Book',
    icon: '💥',
    desc: 'Bold inky cartoon borders with retro pop-art styling.',
    badge: 'Pop Art',
    defaultBg: '#FEF08A',
  },
  {
    id: 'holographic',
    name: 'Holographic Prismatic Foil',
    icon: '✨',
    desc: 'Shifting iridescent rainbow metallic sheen & shine.',
    badge: 'Foil',
    defaultBg: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
  },
  {
    id: 'ticket',
    name: 'Perforated Ticket Stub',
    icon: '🎫',
    desc: 'Vintage concert ticket stub with punch notches & perforation.',
    badge: 'Pass',
    defaultBg: '#FEF3C7',
  },
  {
    id: 'stamp',
    name: 'Vintage Postage Stamp',
    icon: '💌',
    desc: 'Scalloped perforated edges with classic airmail charm.',
    badge: 'Stamp',
    defaultBg: '#FFFFFF',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neon HUD',
    icon: '⚡',
    desc: 'Dark carbon texture with luminous cyan brackets.',
    badge: 'Tech',
    defaultBg: '#090A0F',
  },
  {
    id: 'sticky',
    name: 'Classic Sticky Note',
    icon: '📝',
    desc: 'Warm paper memo pad with realistic peel shadow.',
    badge: 'Memo',
    defaultBg: '#FEF08A',
  },
];

// =================== THEMED BACKGROUND PALETTES ===================
export interface BackgroundOption {
  name: string;
  value: string;
  text: string;
  category: 'halloween' | 'christmas' | 'love' | 'retro' | 'classic';
}

export const THEMED_BACKGROUNDS: BackgroundOption[] = [
  // 🌟 Transparent Cutout (PNG Only)
  { name: '✨ Transparent (PNG Cutout)', value: 'transparent', text: '#FFFFFF', category: 'classic' },

  // 🎃 Halloween & Spooky
  { name: 'Pumpkin Glow', value: 'linear-gradient(135deg, #FF7518, #B33900)', text: '#FFFFFF', category: 'halloween' },
  { name: 'Haunted Midnight', value: 'radial-gradient(#4A0E4E 15%, #0B0014 90%)', text: '#E9D5FF', category: 'halloween' },
  { name: 'Spooky Cobweb', value: 'repeating-linear-gradient(45deg, #18181B 0px, #18181B 15px, #27272A 15px, #27272A 16px)', text: '#F4F4F5', category: 'halloween' },
  { name: 'Poison Slime', value: 'linear-gradient(135deg, #76FF03, #1B5E20)', text: '#002B00', category: 'halloween' },
  { name: 'Blood Moon', value: 'linear-gradient(135deg, #8B0000, #2C0000)', text: '#FFC0CB', category: 'halloween' },
  { name: 'Ghostly Fog', value: 'linear-gradient(135deg, #E2E8F0, #94A3B8)', text: '#0F172A', category: 'halloween' },

  // 🎄 Christmas & Winter
  { name: 'Festive Crimson', value: 'linear-gradient(135deg, #C41E3A, #7F0E23)', text: '#FFFFFF', category: 'christmas' },
  { name: 'Evergreen Pine', value: 'linear-gradient(135deg, #165B33, #093019)', text: '#FFFFFF', category: 'christmas' },
  { name: 'Candy Cane Stripe', value: 'repeating-linear-gradient(45deg, #EF4444, #EF4444 14px, #FFFFFF 14px, #FFFFFF 28px)', text: '#18181B', category: 'christmas' },
  { name: 'Snowflake Night', value: 'radial-gradient(circle, #0F172A 0%, #1E3A8A 100%)', text: '#E0F2FE', category: 'christmas' },
  { name: 'Gold Tinsel', value: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)', text: '#3E2723', category: 'christmas' },
  { name: 'Cozy Gingerbread', value: 'linear-gradient(135deg, #8B5A2B, #5C3818)', text: '#FFFBEB', category: 'christmas' },

  // 💖 Love & Romance
  { name: 'Sweetheart Pink', value: 'linear-gradient(135deg, #FF69B4, #FF1493)', text: '#FFFFFF', category: 'love' },
  { name: 'Rose Petal Velvet', value: 'linear-gradient(135deg, #E11D48, #881337)', text: '#FFFFFF', category: 'love' },
  { name: 'Floating Hearts Vibe', value: 'radial-gradient(circle, #FFE4E6 0%, #F43F5E 100%)', text: '#881337', category: 'love' },
  { name: 'Cupid Wine', value: 'linear-gradient(135deg, #9F1239, #4C0519)', text: '#FCE7F3', category: 'love' },
  { name: 'Pastel Cupcake', value: 'linear-gradient(135deg, #FDE2E4, #FFCAD4, #B5E2FA)', text: '#3E0A24', category: 'love' },
  { name: 'Candlelight Glow', value: 'linear-gradient(135deg, #FFF1E6, #FDD1A0)', text: '#431407', category: 'love' },

  // ⚡ Retro & Cosmic
  { name: 'Cyber Neon', value: 'linear-gradient(135deg, #FF2E93, #00F0FF)', text: '#FFFFFF', category: 'retro' },
  { name: 'Starlight Galaxy', value: 'linear-gradient(135deg, #090A0F, #311042, #0A192F)', text: '#F8FAFC', category: 'retro' },
  { name: 'Y2K Checkerboard', value: 'repeating-conic-gradient(#1E293B 0% 25%, #0F172A 0% 50%)', text: '#F8FAFC', category: 'retro' },
  { name: '80s Synthwave Grid', value: 'linear-gradient(rgba(255,46,147,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.2) 1px, #0F172A 1px)', text: '#FFFFFF', category: 'retro' },
  { name: 'Holographic Opal', value: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)', text: '#FFFFFF', category: 'retro' },
  { name: 'Electric Emerald', value: 'linear-gradient(135deg, #059669, #10B981, #06B6D4)', text: '#FFFFFF', category: 'retro' },

  // 📝 Classics & Pastels
  { name: 'Warm Sticky Yellow', value: '#FEF08A', text: '#1E293B', category: 'classic' },
  { name: 'Sakura Pastel Pink', value: '#FBCFE8', text: '#3E0A24', category: 'classic' },
  { name: 'Fresh Mint Leaf', value: '#A7F3D0', text: '#064E3B', category: 'classic' },
  { name: 'Lavender Mist', value: '#DDD6FE', text: '#371B58', category: 'classic' },
  { name: 'Sky Cloud', value: '#BAE6FD', text: '#0C4A6E', category: 'classic' },
  { name: 'Clean Studio White', value: '#FFFFFF', text: '#0F172A', category: 'classic' },
  { name: 'Lined Notebook', value: 'repeating-linear-gradient(white, white 24px, #CBD5E1 25px)', text: '#0F172A', category: 'classic' },
  { name: 'Dotted Grid Paper', value: 'radial-gradient(#94A3B8 1.5px, #FEF08A 1.5px)', text: '#1E293B', category: 'classic' },
  { name: 'Kraft Vintage', value: 'linear-gradient(135deg, #E2C9A5, #D4B68A)', text: '#3E2723', category: 'classic' },
];

// Frame Styles
export const MINI_FRAMES: { id: FrameStyle; label: string }[] = [
  { id: 'pin', label: '📌 Push Pin' },
  { id: 'tape', label: '🩹 Scotch Tape' },
  { id: 'washi', label: '🎀 Washi Tape' },
  { id: 'gold_crown', label: '👑 Gold Accent' },
  { id: 'stamp', label: '📮 Vintage Stamp' },
  { id: 'comic', label: '💥 Comic Border' },
  { id: 'none', label: '✨ Clean (None)' },
];

export const BIG_FRAMES: { id: FrameStyle; label: string }[] = [
  { id: 'tape', label: '🩹 Scotch Tape' },
  { id: 'gold_crown', label: '👑 Royal Crown' },
  { id: 'neon', label: '⚡ Neon Cyber Glow' },
  { id: 'film_strip', label: '🎞️ 35mm Film' },
  { id: 'duct_tape', label: '🧲 Duct Tape' },
  { id: 'washi', label: '🎀 Artisan Washi' },
  { id: 'comic', label: '💥 Comic Halftone' },
  { id: 'none', label: '✨ Borderless' },
];

// Vastly Expanded Sticker Library with dedicated Love Elements
export const STICKER_CATEGORIES: { id: string; name: string; emojis: string[] }[] = [
  {
    id: 'love',
    name: '💖 Love & Romance',
    emojis: [
      '♡', '💖', '💕', '💘', '💝', '💌', '🌹', '🥀', '💍', '👩‍❤️‍👨',
      '💋', '🧸', '🕊️', '🥂', '🍓', '🎀', '✨', '🫀', '🏹', '🫶',
      '😻', '💐', '🍫', '🎂', '💑', '❤️‍🔥', '🥰', '😘', '💒', '🌸',
    ],
  },
  {
    id: 'spooky',
    name: '🎃 Halloween & Magic',
    emojis: [
      '🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🧛', '🧙', '🔮', '🐈‍⬛',
      '🍬', '🍫', '🩸', '🕯️', '🌙', '⚰️', '🧟', '⚡', '🦉', '🍁',
    ],
  },
  {
    id: 'holiday',
    name: '🎄 Christmas & Winter',
    emojis: [
      '🎄', '🎅', '❄️', '⛄', '🎁', '🦌', '🔔', '🍪', '🥛', '🧦',
      '🧣', '🧤', '🕯️', '⭐', '✨', '☕', '🌲', '🛷', '🌟', '🎉',
    ],
  },
  {
    id: 'cool',
    name: '🔥 Memes & Cool',
    emojis: [
      '😎', '🕶️', '🐸', '🐶', '🚀', '🔥', '💯', '👑', '💎', '🍕',
      '💀', '🍿', '⚡', '💣', '🧢', '🛹', '🛸', '🎯', '🎸', '💰',
    ],
  },
  {
    id: 'anime',
    name: '🎮 Anime & Gaming',
    emojis: [
      '🎮', '🕹️', '👾', '🍥', '🎧', '⚔️', '🪐', '🏆', '🥋', '💥',
      '🍜', '🎋', '🍙', '🍣', '🍙', '⚡', '🌌', '🤖', '🦊', '🐉',
    ],
  },
  {
    id: 'doodles',
    name: '✌️ Signs & Doodles',
    emojis: [
      '✌️', '☕', '⭐', '☀️', '🌙', '🌊', '🌿', '🎨', '🎵', '🍀',
      '💡', '📌', '⚓', '🔑', '🏷️', '🪄', '🪶', '🪞', '🧁', '🍩',
    ],
  },
  {
    id: 'phrases',
    name: '💌 Romantic Quotes & Stamps',
    emojis: [
      'Forever ♡', 'My Person', 'Soulmates', 'XOXO', 'Wild & Free',
      'Good Vibes', 'Made with Love', 'Main Character', 'Since 2024 ♡', 'Together',
      'Only You', 'Best Day Ever', 'Love You Most', 'True Love', 'Dream Big',
    ],
  },
  {
    id: 'badges',
    name: '🏷️ Badges & Insignias',
    emojis: [
      '★ VIP ★', '✔ VERIFIED', 'ORIGINAL', 'TOP SPOT', 'LIMITED',
      'LEGENDARY', '100% REAL', 'NEO', 'PASS', 'SPOTLIGHT',
    ],
  },
];

export const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiply (Darken)' },
  { id: 'screen', label: 'Screen (Lighten)' },
  { id: 'overlay', label: 'Overlay (Vibrant)' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'color-dodge', label: 'Color Dodge (Glow)' },
  { id: 'color-burn', label: 'Color Burn' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
  { id: 'difference', label: 'Difference' },
  { id: 'exclusion', label: 'Exclusion' },
];

// Default Photo for Big Pop
export const DEFAULT_SPOT_PHOTO = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';

export const BRUSH_STYLES: { id: BrushStyle; name: string; icon: string; desc: string }[] = [
  { id: 'neon', name: 'Neon Glow', icon: '🌟', desc: 'Glowing electric stroke' },
  { id: 'calligraphy', name: 'Calligraphy', icon: '✒️', desc: 'Angled fountain chisel' },
  { id: 'graffiti', name: 'Graffiti Spray', icon: '💨', desc: 'Airbrush splatter dots' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨', desc: 'Soft translucent pastel' },
  { id: 'pen', name: 'Gel Pen', icon: '🖊️', desc: 'Crisp precision ink' },
  { id: 'pencil', name: 'Pencil', icon: '✏️', desc: 'Textured graphite sketch' },
  { id: 'rainbow', name: 'Rainbow Sparkle', icon: '✨', desc: 'Shifting hue + stars' },
  { id: 'highlighter', name: 'Highlighter', icon: '🖍️', desc: 'Wide chisel marker' },
  { id: 'eraser', name: 'Eraser', icon: '🧹', desc: 'Alpha wipe eraser' },
];

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  hue: 0,
  blur: 0,
  blurType: 'gaussian',
  sharpen: 0,
  vignette: 0,
  grain: 0,
  highlights: 0,
  shadows: 0,
  retouchSmooth: 0,
  blemishRemoval: 0,
  faceGlow: 0,
  teethWhitening: 0,
  reshapeAmount: 0,
  hairTint: 'none',
  hslRed: 0,
  hslGreen: 0,
  hslBlue: 0,
  hslYellow: 0,
  curveRgb: 'linear',
  flipH: false,
  flipV: false,
  rotationAngle: 0,
  aspectRatio: 'free',
  perspectiveSkewX: 0,
  perspectiveSkewY: 0,
  filter: 'none',
  effect: 'none',
};

const DEFAULT_MINI_DRAFT: PlanDraft = {
  headline: 'Good Vibes Only ♡',
  secondaryText: 'Living life in full color.',
  creatorName: 'Spot Pioneer',
  fontFamily: 'Caveat',
  fontSize: 22,
  textColor: '#1E293B',
  textOpacity: 1,
  alignment: 'center',
  backgroundColor: '#FEF08A',
  frameStyle: 'pin',
  shape: 'sticky',
  stickers: [
    { id: 'mini_stk_1', emojiOrIcon: '♡', x: 125, y: 15, size: 26, rotation: 8, opacity: 1 },
  ],
  photoAdjustments: { ...DEFAULT_ADJUSTMENTS },
  layers: [],
  isCurvedText: false,
  letterSpacing: 0,
};

const DEFAULT_BIG_DRAFT: PlanDraft = {
  headline: 'My Memory ♡',
  secondaryText: 'Living life in full color.',
  creatorName: 'Spot Pioneer',
  fontFamily: 'Caveat',
  fontSize: 22,
  textColor: '#0F172A',
  textOpacity: 1,
  alignment: 'center',
  backgroundColor: '#FFFFFF',
  frameStyle: 'tape',
  shape: 'polaroid',
  imageUrl: DEFAULT_SPOT_PHOTO,
  photoOpacity: 1,
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
  drawingDataUrl: null,
  drawingOpacity: 1,
  stickers: [
    { id: 'big_stk_1', emojiOrIcon: '💖', x: 125, y: 20, size: 28, rotation: -6, opacity: 1 },
    { id: 'big_stk_2', emojiOrIcon: '✨', x: 20, y: 20, size: 26, rotation: 12, opacity: 0.9 },
  ],
  photoAdjustments: { ...DEFAULT_ADJUSTMENTS },
  layers: [],
  isCurvedText: false,
  letterSpacing: 0,
};

export const CreateSpotModal: React.FC<CreateSpotModalProps> = ({
  isOpen,
  onClose,
  initialTier,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // Modal Step
  const [step, setStep] = useState<'tier' | 'editor' | 'checkout' | 'processing'>('editor');
  const [tier, setTier] = useState<ProductTier>(initialTier);

  // COMPLETELY ISOLATED DRAFTS TO PREVENT LEAKING BETWEEN PLANS
  const [miniDraft, setMiniDraft] = useState<PlanDraft>(DEFAULT_MINI_DRAFT);
  const [bigDraft, setBigDraft] = useState<PlanDraft>(DEFAULT_BIG_DRAFT);

  // Active Draft based on tier
  const currentDraft = tier === 'big_pop' ? bigDraft : miniDraft;

  const updateDraft = (updates: Partial<PlanDraft>) => {
    if (tier === 'big_pop') {
      setBigDraft(prev => ({ ...prev, ...updates }));
    } else {
      setMiniDraft(prev => ({ ...prev, ...updates }));
    }
  };

  // Active Tool Tab in Editor
  const [activeEditorTab, setActiveEditorTab] = useState<
    'photo' | 'adjust' | 'retouch' | 'text' | 'stickers' | 'draw' | 'frames' | 'themes'
  >('photo');
  const [selectedBgCategory, setSelectedBgCategory] = useState<'all' | 'halloween' | 'christmas' | 'love' | 'retro' | 'classic'>('all');
  const [selectedFontCategory, setSelectedFontCategory] = useState<string>('All');

  // History tracking for Undo/Redo
  const [undoHistory, setUndoHistory] = useState<PlanDraft[]>([]);
  const [redoHistory, setRedoHistory] = useState<PlanDraft[]>([]);

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const previous = undoHistory[undoHistory.length - 1];
    setRedoHistory(prev => [...prev, currentDraft]);
    setUndoHistory(prev => prev.slice(0, -1));
    if (tier === 'big_pop') {
      setBigDraft(previous);
    } else {
      setMiniDraft(previous);
    }
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setUndoHistory(prev => [...prev, currentDraft]);
    setRedoHistory(prev => prev.slice(0, -1));
    if (tier === 'big_pop') {
      setBigDraft(next);
    } else {
      setMiniDraft(next);
    }
  };

  // Sticker search & AI prompt
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [aiStickerPrompt, setAiStickerPrompt] = useState('');

  // Photo Adjustments update helper
  const updatePhotoAdjustments = (updates: Partial<PhotoAdjustments>) => {
    const cur = currentDraft.photoAdjustments || DEFAULT_ADJUSTMENTS;
    updateDraft({
      photoAdjustments: { ...cur, ...updates },
    });
  };

  // Layer Management Handlers
  const handleAddImageLayer = (imgUrl: string) => {
    const newLayer: SpotLayer = {
      id: `layer_img_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'image',
      name: `Photo #${(currentDraft.layers?.length || 0) + 1}`,
      content: imgUrl,
      x: 20,
      y: 25,
      width: tier === 'big_pop' ? 140 : 100,
      height: tier === 'big_pop' ? 140 : 100,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      locked: false,
      visible: true,
    };
    updateDraft({ layers: [...(currentDraft.layers || []), newLayer] });
    setSelectedItemId(newLayer.id);
  };

  const handleAddShapeLayer = (shapeType: 'rectangle' | 'circle' | 'heart' | 'star' | 'arrow' | 'speech_bubble' | 'cloud' | 'diamond' | 'flower' | 'lightning') => {
    const newLayer: SpotLayer = {
      id: `layer_shp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'shape',
      name: `${shapeType.toUpperCase()}`,
      content: shapeType,
      shapeType,
      fillColor: '#FF2E93',
      x: 35,
      y: 40,
      width: 70,
      height: 70,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      locked: false,
      visible: true,
    };
    updateDraft({ layers: [...(currentDraft.layers || []), newLayer] });
    setSelectedItemId(newLayer.id);
  };

  const handleBringToFront = (id: string) => {
    const list = [...(currentDraft.layers || [])];
    const idx = list.findIndex(l => l.id === id);
    if (idx < 0 || idx === list.length - 1) return;
    const [item] = list.splice(idx, 1);
    list.push(item);
    updateDraft({ layers: list });
  };

  const handleSendToBack = (id: string) => {
    const list = [...(currentDraft.layers || [])];
    const idx = list.findIndex(l => l.id === id);
    if (idx <= 0) return;
    const [item] = list.splice(idx, 1);
    list.unshift(item);
    updateDraft({ layers: list });
  };

  const handleMergeLayers = () => {
    if (!currentDraft.layers || currentDraft.layers.length === 0) return;
    updateDraft({
      layers: [
        {
          id: `layer_merged_${Date.now()}`,
          type: 'image',
          name: 'Merged Composite',
          content: currentDraft.imageUrl || (currentDraft.layers[0]?.content ?? ''),
          x: 0,
          y: 0,
          width: tier === 'big_pop' ? 170 : 170,
          height: tier === 'big_pop' ? 210 : 170,
          rotation: 0,
          opacity: 1,
          blendMode: 'normal',
          locked: false,
          visible: true,
        },
      ],
    });
  };

  const handleAddTextLayer = (initialText: string = 'New Text') => {
    const newLayer: SpotLayer = {
      id: `layer_txt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'text',
      name: 'Text Layer',
      content: initialText,
      fontFamily: currentDraft.fontFamily,
      fontSize: 20,
      textColor: '#FFFFFF',
      x: 15,
      y: 50,
      width: 150,
      height: 36,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      locked: false,
      visible: true,
    };
    updateDraft({ layers: [...(currentDraft.layers || []), newLayer] });
    setSelectedItemId(newLayer.id);
  };

  const handleUpdateLayer = (id: string, updates: Partial<SpotLayer>) => {
    updateDraft({
      layers: (currentDraft.layers || []).map(l => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  const handleDeleteLayer = (id: string) => {
    updateDraft({
      layers: (currentDraft.layers || []).filter(l => l.id !== id),
    });
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleDuplicateLayer = (layer: SpotLayer) => {
    const newLayer: SpotLayer = {
      ...layer,
      id: `layer_dup_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: `${layer.name || 'Layer'} (Copy)`,
      x: layer.x + 12,
      y: layer.y + 12,
    };
    updateDraft({ layers: [...(currentDraft.layers || []), newLayer] });
    setSelectedItemId(newLayer.id);
  };

  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const list = [...(currentDraft.layers || [])];
    const idx = list.findIndex(l => l.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    updateDraft({ layers: list });
  };

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleAddImageLayer(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiStickerCreate = () => {
    if (!aiStickerPrompt.trim()) return;
    const tag = aiStickerPrompt.trim();
    handleAddSticker(`✨ ${tag}`);
    setAiStickerPrompt('');
  };

  const activeSelectedLayer = (currentDraft.layers || []).find(l => l.id === selectedItemId);

  // Helper to select card shape / frame with automatic background handling
  const handleSelectShape = (shapeOpt: ShapeOption) => {
    if (shapeOpt.id === 'transparent') {
      updateDraft({
        shape: 'transparent',
        backgroundColor: 'transparent',
        textColor: '#FFFFFF',
      });
    } else {
      const fallbackBg = currentDraft.backgroundColor === 'transparent' ? (shapeOpt.defaultBg || (tier === 'big_pop' ? '#FFFFFF' : '#FEF08A')) : currentDraft.backgroundColor;
      updateDraft({
        shape: shapeOpt.id,
        backgroundColor: fallbackBg,
      });
    }
  };

  // Helper to select background palette
  const handleSelectBackground = (bg: BackgroundOption) => {
    if (bg.value === 'transparent') {
      updateDraft({
        backgroundColor: 'transparent',
        shape: 'transparent',
        textColor: '#FFFFFF',
      });
    } else {
      const newShape = currentDraft.shape === 'transparent' ? (tier === 'big_pop' ? 'frameless' : 'sticky') : currentDraft.shape;
      updateDraft({
        backgroundColor: bg.value,
        textColor: bg.text,
        shape: newShape,
      });
    }
  };

  // Currently Selected Item on Card: null | 'headline' | 'photo' | 'drawing' | sticker_id
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const lastSelectedAtRef = useRef<number>(0);

  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
    if (!id) return;
    lastSelectedAtRef.current = Date.now();

    // Auto-focus the corresponding Picsart tool tab when user taps an element:
    if (id === 'photo') {
      setActiveEditorTab('photo');
      setIsDrawingMode(false);
    } else if (id === 'headline' || id === 'subtext' || id === 'author') {
      setActiveEditorTab('text');
      setIsDrawingMode(false);
    } else if (id === 'background') {
      setActiveEditorTab('themes');
      setIsDrawingMode(false);
    } else {
      setActiveEditorTab('stickers');
      setIsDrawingMode(false);
    }
  };

  // Sticker categories
  const [stickerCategory, setStickerCategory] = useState<string>('love');

  // =================== DRAWING STUDIO (BIG POP ONLY) ===================
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [drawTool, setDrawTool] = useState<BrushStyle>('neon');
  const [drawColor, setDrawColor] = useState('#FF2E93');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [brushOpacity, setBrushOpacity] = useState<number>(1);
  const [rainbowHue, setRainbowHue] = useState<number>(0);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Switch Plan with Complete Isolation
  const handleSelectPlan = (newTier: ProductTier) => {
    setTier(newTier);
    setSelectedItemId(null);
    setIsDrawingMode(false);
    if (newTier === 'mini_pop') {
      setActiveEditorTab('text');
    }
  };

  // =================== FREE ELEMENT MANIPULATION ===================

  // Update a single sticker
  const handleUpdateSticker = (id: string, updates: Partial<StickerItem>) => {
    updateDraft({
      stickers: currentDraft.stickers.map(s => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  // Delete a sticker
  const handleDeleteSticker = (id: string) => {
    updateDraft({
      stickers: currentDraft.stickers.filter(s => s.id !== id),
    });
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // Add new sticker
  const handleAddSticker = (emoji: string) => {
    if (currentDraft.stickers.length >= (tier === 'big_pop' ? 24 : 12)) return;
    const newId = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const boundsW = 170;
    const boundsH = tier === 'big_pop' ? 210 : 170;
    const newStk: StickerItem = {
      id: newId,
      emojiOrIcon: emoji,
      x: Math.round(boundsW * 0.25 + Math.random() * (boundsW * 0.4)),
      y: Math.round(boundsH * 0.25 + Math.random() * (boundsH * 0.4)),
      size: 28,
      rotation: Math.floor(Math.random() * 20 - 10),
      opacity: 1,
    };
    updateDraft({
      stickers: [...currentDraft.stickers, newStk],
    });
    setSelectedItemId(newId);
  };

  // Active selected sticker lookup
  const activeSelectedSticker = currentDraft.stickers.find(s => s.id === selectedItemId);

  // =================== DRAWING ENGINE (BIG POP ONLY) ===================

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history frame for undo
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory(prev => [...prev.slice(-12), frame]);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = brushOpacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawTool === 'neon') {
        ctx.strokeStyle = drawColor;
        ctx.shadowColor = drawColor;
        ctx.shadowBlur = 14;
        ctx.lineWidth = brushSize;
      } else if (drawTool === 'calligraphy') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.lineWidth = brushSize * 1.5;
      } else if (drawTool === 'watercolor') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 4;
        ctx.globalAlpha = brushOpacity * 0.4;
        ctx.lineWidth = brushSize * 2;
      } else if (drawTool === 'highlighter') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = brushOpacity * 0.45;
        ctx.lineWidth = brushSize * 2.5;
      } else if (drawTool === 'pencil') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = brushOpacity * 0.75;
        ctx.lineWidth = Math.max(1, brushSize * 0.8);
      } else if (drawTool === 'rainbow') {
        const nextHue = (rainbowHue + 15) % 360;
        setRainbowHue(nextHue);
        ctx.strokeStyle = `hsl(${nextHue}, 100%, 55%)`;
        ctx.shadowColor = `hsl(${nextHue}, 100%, 65%)`;
        ctx.shadowBlur = 10;
        ctx.lineWidth = brushSize;
      } else {
        // pen or spray
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.lineWidth = brushSize;
      }
    }

    setIsPainting(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting || !isDrawingMode) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    if (drawTool === 'graffiti') {
      // Stochastic spray airbrush effect
      ctx.fillStyle = drawColor;
      ctx.globalAlpha = brushOpacity * 0.35;
      const density = brushSize * 4;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * brushSize * 1.5;
        const sprayX = x + Math.cos(angle) * radius;
        const sprayY = y + Math.sin(angle) * radius;
        ctx.fillRect(sprayX, sprayY, 1.5, 1.5);
      }
    } else if (drawTool === 'rainbow') {
      const nextHue = (rainbowHue + 3) % 360;
      setRainbowHue(nextHue);
      ctx.strokeStyle = `hsl(${nextHue}, 100%, 55%)`;
      ctx.shadowColor = `hsl(${nextHue}, 100%, 65%)`;
      ctx.lineTo(x, y);
      ctx.stroke();

      // Sprinkle occasional sparkle star
      if (Math.random() < 0.15) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + (Math.random() * 10 - 5), y + (Math.random() * 10 - 5), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isPainting) return;
    setIsPainting(false);
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      updateDraft({ drawingDataUrl: dataUrl });
    }
  };

  const handleUndoDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || drawingHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevFrame = drawingHistory[drawingHistory.length - 1];
    ctx.putImageData(prevFrame, 0, 0);
    setDrawingHistory(prev => prev.slice(0, -1));
    updateDraft({ drawingDataUrl: canvas.toDataURL('image/png') });
  };

  const handleClearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);
    updateDraft({ drawingDataUrl: null });
  };

  // Image File Upload for Big Pop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const rawB64 = reader.result;
        // Instant visual parity preview for user
        updateDraft({
          imageUrl: rawB64,
          photoZoom: 1,
          photoOffsetX: 0,
          photoOffsetY: 0,
        });

        // Background server-side compression & object storage
        try {
          const res = await api.uploadImage(rawB64, file.name);
          if (res?.imageUrl) {
            updateDraft({ imageUrl: res.imageUrl });
          }
        } catch (err) {
          console.warn('Background image upload notice:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Proceed to checkout and publish
  const handleProceedToPayment = async () => {
    if (!currentDraft.creatorName.trim()) {
      setErrorMessage('Please enter your creator display name');
      return;
    }
    if (!currentDraft.headline.trim()) {
      setErrorMessage('Please enter your headline or message');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setStep('processing');

    try {
      // Ensure image is converted to optimized object storage asset before submitting
      let finalImageUrl = currentDraft.imageUrl;
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        try {
          const uploadRes = await api.uploadImage(finalImageUrl, 'photo.jpg');
          if (uploadRes?.imageUrl) {
            finalImageUrl = uploadRes.imageUrl;
          }
        } catch (e) {
          console.warn('Image optimization fallback:', e);
        }
      }

      const draftSpot: Partial<Spot> = {
        shape: currentDraft.shape,
        background: currentDraft.backgroundColor,
        creatorName: currentDraft.creatorName.trim(),
        content: {
          headline: currentDraft.headline.trim(),
          headlineX: currentDraft.headlineX,
          headlineY: currentDraft.headlineY,
          text: currentDraft.secondaryText.trim(),
          subtextX: currentDraft.subtextX,
          subtextY: currentDraft.subtextY,
          subtextSize: currentDraft.subtextSize,
          author: currentDraft.creatorName.trim(),
          authorX: currentDraft.authorX,
          authorY: currentDraft.authorY,
          authorSize: currentDraft.authorSize,
          authorOpacity: currentDraft.authorOpacity,
          textColor: currentDraft.textColor,
          fontFamily: currentDraft.fontFamily,
          fontSize: currentDraft.fontSize,
          textOpacity: currentDraft.textOpacity,
          alignment: currentDraft.alignment,
          imageUrl: finalImageUrl,
          photoOpacity: currentDraft.photoOpacity,
          photoZoom: currentDraft.photoZoom,
          photoOffsetX: currentDraft.photoOffsetX,
          photoOffsetY: currentDraft.photoOffsetY,
          stickers: currentDraft.stickers,
          drawingData: currentDraft.drawingDataUrl || undefined,
          drawingOpacity: currentDraft.drawingOpacity,
          frameStyle: currentDraft.frameStyle,
          photoAdjustments: currentDraft.photoAdjustments,
          layers: currentDraft.layers,
          isCurvedText: currentDraft.isCurvedText,
          curveRadius: currentDraft.curveRadius,
          textStroke: currentDraft.textStroke,
          textGlow: currentDraft.textGlow,
          letterSpacing: currentDraft.letterSpacing,
        },
      };

      const orderRes = await api.createOrder({
        productId: tier,
        spotDraft: draftSpot,
        creatorName: currentDraft.creatorName.trim(),
      });

      const verifyRes = await api.verifyPayment({
        orderId: orderRes.order.id,
        razorpayOrderId: orderRes.order.razorpayOrderId || `rzp_order_${Date.now()}`,
        razorpayPaymentId: `pay_${Date.now()}_demo`,
        razorpaySignature: 'dev_mock_signature_verified',
      });

      if (verifyRes.success && verifyRes.spot) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF2E93', '#FFE600', '#00F0FF', '#7928CA'],
        });
        onSuccess(verifyRes.spot);
        onClose();
      } else {
        throw new Error('Payment processing failed. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMessage(message);
      setStep('editor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered backgrounds (always keep Transparent Cutout accessible)
  const filteredBackgrounds = THEMED_BACKGROUNDS.filter(b =>
    selectedBgCategory === 'all' ? true : (b.category === selectedBgCategory || b.value === 'transparent')
  );

  // Filtered fonts
  const filteredFonts = selectedFontCategory === 'All'
    ? ALL_FONTS
    : ALL_FONTS.filter(f => f.category === selectedFontCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[96vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">

        {/* Top Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-outfit font-bold text-base sm:text-lg text-white">
              Studio Spot Creator
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FF2E93]/20 text-[#FF5EAA] border border-[#FF2E93]/30">
              {tier === 'big_pop' ? 'Big Pop ₹99' : 'Mini Pop ₹29'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 no-scrollbar space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Plan Switcher Pills */}
          <div className="flex items-center gap-2 p-1 bg-black/50 rounded-2xl border border-white/10 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => handleSelectPlan('mini_pop')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tier === 'mini_pop'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📝</span>
              <span>Mini Pop ₹29</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPlan('big_pop')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tier === 'big_pop'
                  ? 'bg-[#FF2E93] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📸</span>
              <span>Big Pop ₹99</span>
            </button>
          </div>

          {/* ================= STUDIO WORKSPACE ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* LEFT / TOP: LIVE INTERACTIVE WYSIWYG PREVIEW */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget && Date.now() - lastSelectedAtRef.current > 350) {
                    setSelectedItemId(null);
                  }
                }}
                className="w-full p-4 sm:p-6 rounded-2xl bg-[#090A0F] border border-white/10 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden shadow-inner select-none"
              >
                <div className="absolute top-2.5 left-3 text-[10px] tracking-wider uppercase text-slate-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>100% LIVE PARITY · DIRECT FREE DRAG & CORNER RESIZE</span>
                </div>

                {/* Undo / Redo Toolbar */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-20">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoHistory.length === 0}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Undo"
                  >
                    ↩ Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoHistory.length === 0}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Redo"
                  >
                    ↪ Redo
                  </button>
                </div>

                {/* THE UNIFIED CANONICAL SPOT CARD */}
                <div className="relative mt-6">
                  <SpotCard
                    tier={tier}
                    shape={currentDraft.shape}
                    background={currentDraft.backgroundColor}
                    content={{
                      headline: currentDraft.headline,
                      headlineX: currentDraft.headlineX,
                      headlineY: currentDraft.headlineY,
                      text: currentDraft.secondaryText,
                      subtextX: currentDraft.subtextX,
                      subtextY: currentDraft.subtextY,
                      subtextSize: currentDraft.subtextSize,
                      author: currentDraft.creatorName,
                      authorX: currentDraft.authorX,
                      authorY: currentDraft.authorY,
                      authorSize: currentDraft.authorSize,
                      authorOpacity: currentDraft.authorOpacity,
                      textColor: currentDraft.textColor,
                      fontFamily: currentDraft.fontFamily,
                      fontSize: currentDraft.fontSize,
                      textOpacity: currentDraft.textOpacity,
                      alignment: currentDraft.alignment,
                      imageUrl: tier === 'big_pop' ? currentDraft.imageUrl : undefined,
                      photoOpacity: currentDraft.photoOpacity,
                      photoZoom: currentDraft.photoZoom,
                      photoOffsetX: currentDraft.photoOffsetX,
                      photoOffsetY: currentDraft.photoOffsetY,
                      stickers: currentDraft.stickers,
                      drawingData: currentDraft.drawingDataUrl || undefined,
                      drawingOpacity: currentDraft.drawingOpacity,
                      frameStyle: currentDraft.frameStyle,
                      photoAdjustments: currentDraft.photoAdjustments,
                      layers: currentDraft.layers,
                      isCurvedText: currentDraft.isCurvedText,
                      curveRadius: currentDraft.curveRadius,
                      textStroke: currentDraft.textStroke,
                      textGlow: currentDraft.textGlow,
                      letterSpacing: currentDraft.letterSpacing,
                    }}
                    creatorName={currentDraft.creatorName}
                    interactive={!isDrawingMode}
                    selectedItemId={selectedItemId}
                    onSelectItem={handleSelectItem}
                    onUpdateSticker={handleUpdateSticker}
                    onDeleteSticker={handleDeleteSticker}
                    onUpdateLayer={handleUpdateLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onUpdateContent={(updates) => updateDraft(updates)}
                    // Overlay full card drawing canvas when drawing mode is toggled
                    drawingCanvasOverlay={
                      isDrawingMode ? (
                        <canvas
                          ref={drawingCanvasRef}
                          width={tier === 'big_pop' ? 170 : 170}
                          height={tier === 'big_pop' ? 210 : 170}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-full cursor-crosshair touch-none rounded-xs"
                          style={{ background: 'transparent' }}
                        />
                      ) : undefined
                    }
                  />
                </div>

                {/* Helper prompt below card */}
                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  {isDrawingMode
                    ? '✏️ Drawing Mode Active: Sketch anywhere on your spot!'
                    : '👉 Tap any element (Headline, Subtext, Photo, Sticker) to select & edit instantly!'}
                </p>
              </div>

              {/* ACTIVE SELECTED ITEM FLOATING QUICK STATUS */}
              {selectedItemId && (
                <div className="w-full mt-3 px-3.5 py-2.5 rounded-xl bg-[#181B2A] border border-[#FF2E93]/40 flex items-center justify-between shadow-lg animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      {activeSelectedSticker
                        ? `Sticker (${activeSelectedSticker.emojiOrIcon}) Selected`
                        : selectedItemId === 'headline'
                        ? 'Headline Selected'
                        : selectedItemId === 'subtext'
                        ? 'Subtext Selected'
                        : selectedItemId === 'author'
                        ? 'Creator Tag Selected'
                        : selectedItemId === 'photo'
                        ? 'Photo Selected'
                        : selectedItemId === 'background'
                        ? 'Background Selected'
                        : 'Item Selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSelectedSticker && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSticker(activeSelectedSticker.id)}
                        className="px-2 py-0.5 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(null)}
                      className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT / BOTTOM: STUDIO TOOLS ACCORDION TABS */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* Tool Navigation Bar (Picsart Mobile & Desktop Responsive Scrolling Pills) */}
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                {/* Tools (Photo Crop & Upload) - Big Pop Only */}
                {tier === 'big_pop' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEditorTab('photo');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      activeEditorTab === 'photo' && !isDrawingMode
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📐</span>
                    <span>Tools</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('adjust');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'adjust' && !isDrawingMode
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎨</span>
                  <span>Adjust</span>
                </button>

                {/* Retouch (Portrait Beautify) - Big Pop Only */}
                {tier === 'big_pop' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEditorTab('retouch');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      activeEditorTab === 'retouch' && !isDrawingMode
                        ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>✨</span>
                    <span>Retouch</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('text');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'text' && !isDrawingMode
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>✍️</span>
                  <span>Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('stickers');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'stickers' && !isDrawingMode
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>💖</span>
                  <span>Stickers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('draw');
                    setIsDrawingMode(true);
                    setSelectedItemId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isDrawingMode
                      ? 'bg-gradient-to-r from-[#FF2E93] to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🖌️</span>
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('frames');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'frames' && !isDrawingMode
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🖼️</span>
                  <span>Frames</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('themes');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'themes' && !isDrawingMode
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌈</span>
                  <span>Background</span>
                </button>
              </div>

              {/* TAB 1: TOOLS (CROP & PHOTO - BIG POP ONLY) */}
              {activeEditorTab === 'photo' && tier === 'big_pop' && !isDrawingMode && (
                <PhotoCropTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  updatePhotoAdjustments={updatePhotoAdjustments}
                  tier={tier}
                  onFileUpload={handleFileUpload}
                />
              )}

              {/* TAB 2: ADJUST (SINGLE-SLIDER PICSART ENGINE) */}
              {activeEditorTab === 'adjust' && !isDrawingMode && (
                <AdjustTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  updatePhotoAdjustments={updatePhotoAdjustments}
                />
              )}

              {/* TAB 3: RETOUCH & BEAUTIFY (BIG POP ONLY) */}
              {activeEditorTab === 'retouch' && tier === 'big_pop' && !isDrawingMode && (
                <RetouchTab
                  currentDraft={currentDraft}
                  updatePhotoAdjustments={updatePhotoAdjustments}
                />
              )}

              {/* TAB 4: TEXT STUDIO */}
              {activeEditorTab === 'text' && !isDrawingMode && (
                <TextStudioTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  selectedFontCategory={selectedFontCategory}
                  setSelectedFontCategory={setSelectedFontCategory}
                />
              )}

              {/* TAB 5: STICKERS */}
              {activeEditorTab === 'stickers' && !isDrawingMode && (
                <StickersStockTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  handleAddSticker={handleAddSticker}
                  onCustomStickerUpload={handleCustomStickerUpload}
                  selectedItemId={selectedItemId}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                />
              )}

              {/* TAB 7: DRAW & PAINT */}
              {(isDrawingMode || activeEditorTab === 'draw') && (
                <DrawStudioTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  drawTool={drawTool}
                  setDrawTool={setDrawTool}
                  drawColor={drawColor}
                  setDrawColor={setDrawColor}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  brushOpacity={brushOpacity}
                  setBrushOpacity={setBrushOpacity}
                  handleUndoDrawing={handleUndoDrawing}
                  handleClearDrawing={handleClearDrawing}
                  handleAddShapeLayer={handleAddShapeLayer}
                />
              )}

              {/* TAB 8: FRAMES & SHAPE */}
              {activeEditorTab === 'frames' && !isDrawingMode && (
                <FramesTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  tier={tier}
                  handleSelectShape={handleSelectShape}
                />
              )}

              {/* TAB 9: THEMES & BG */}
              {activeEditorTab === 'themes' && !isDrawingMode && (
                <ThemesTab
                  currentDraft={currentDraft}
                  updateDraft={updateDraft}
                  selectedBgCategory={selectedBgCategory}
                  setSelectedBgCategory={setSelectedBgCategory}
                />
              )}

              {/* ACTION FOOTER */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400">Total Placement Fee:</span>
                  <span className="text-lg font-bold text-white">
                    {tier === 'big_pop' ? '₹99 One-Time' : '₹29 One-Time'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleProceedToPayment}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 ${
                      tier === 'big_pop'
                        ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white hover:opacity-90'
                        : 'bg-amber-400 text-black hover:bg-amber-300'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Publishing Spot...</span>
                      </>
                    ) : (
                      <>
                        <span>Claim & Place Spot ({tier === 'big_pop' ? '₹99' : '₹29'}) →</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
