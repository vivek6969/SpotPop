import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ProductTier, PRODUCTS, Spot, SpotShape, FrameStyle, StickerItem, SpotLayer, PhotoAdjustments, BlendMode } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';
import { FILTER_PRESETS, AI_CAPTION_PRESETS } from '../../utils/photoFilters';

interface CreateSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier: ProductTier;
  onSuccess: (newSpot: Spot) => void;
}

// =================== FONTS ===================
export const ALL_FONTS = [
  { id: 'Caveat', name: 'Caveat (Casual Handwriting)', family: "'Caveat', cursive", category: 'Handwritten' },
  { id: 'Dancing Script', name: 'Dancing Script (Calligraphy)', family: "'Dancing Script', cursive", category: 'Handwritten' },
  { id: 'Pacifico', name: 'Pacifico (Brush Script)', family: "'Pacifico', cursive", category: 'Handwritten' },
  { id: 'Shadows Into Light', name: 'Shadows Into Light (Doodle)', family: "'Shadows Into Light', cursive", category: 'Handwritten' },
  { id: 'Gloria Hallelujah', name: 'Gloria Hallelujah (Blackboard)', family: "'Gloria Hallelujah', cursive", category: 'Handwritten' },
  { id: 'Outfit', name: 'Outfit (Modern Bold Sans)', family: "'Outfit', sans-serif", category: 'Modern' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Clean Minimal)', family: "'Plus Jakarta Sans', sans-serif", category: 'Modern' },
  { id: 'Fredoka', name: 'Fredoka (Cute Bubble Sans)', family: "'Fredoka', sans-serif", category: 'Modern' },
  { id: 'Comfortaa', name: 'Comfortaa (Soft Geometric)', family: "'Comfortaa', cursive", category: 'Modern' },
  { id: 'Permanent Marker', name: 'Permanent Marker (Graffiti Tag)', family: "'Permanent Marker', cursive", category: 'Display' },
  { id: 'Bungee', name: 'Bungee (Urban Signage)', family: "'Bungee', cursive", category: 'Display' },
  { id: 'Bebas Neue', name: 'Bebas Neue (Bold Impact)', family: "'Bebas Neue', cursive", category: 'Display' },
  { id: 'Creepster', name: 'Creepster (Spooky Horror)', family: "'Creepster', cursive", category: 'Display' },
  { id: 'Press Start 2P', name: 'Press Start 2P (8-Bit Arcade)', family: "'Press Start 2P', monospace", category: 'Retro' },
  { id: 'Space Mono', name: 'Space Mono (Cyber Tech)', family: "'Space Mono', monospace", category: 'Retro' },
  { id: 'VT323', name: 'VT323 (Retro Terminal)', family: "'VT323', monospace", category: 'Retro' },
  { id: 'Playfair Display', name: 'Playfair Display (Editorial Luxury)', family: "'Playfair Display', serif", category: 'Serif' },
  { id: 'Cinzel', name: 'Cinzel (Roman Classical)', family: "'Cinzel', serif", category: 'Serif' },
  { id: 'Abril Fatface', name: 'Abril Fatface (High-Fashion Title)', family: "'Abril Fatface', cursive", category: 'Serif' },
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

// Sample Photos for Big Pop
const SAMPLE_PHOTOS = [
  { label: 'Sunset Love', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cool Shades', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cat with Glasses', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
  { label: 'Anime Girl Lo-Fi', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80' },
  { label: 'Space Star', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80' },
];

// Brush styles definition for Big Pop Drawing Studio
export type BrushStyle =
  | 'neon'
  | 'calligraphy'
  | 'graffiti'
  | 'watercolor'
  | 'pen'
  | 'rainbow'
  | 'highlighter'
  | 'eraser';

export const BRUSH_STYLES: { id: BrushStyle; name: string; icon: string; desc: string }[] = [
  { id: 'neon', name: 'Neon Glow', icon: '🌟', desc: 'Glowing electric stroke' },
  { id: 'calligraphy', name: 'Calligraphy', icon: '✒️', desc: 'Angled fountain chisel' },
  { id: 'graffiti', name: 'Graffiti Spray', icon: '💨', desc: 'Airbrush splatter dots' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨', desc: 'Soft translucent pastel' },
  { id: 'pen', name: 'Gel Pen', icon: '🖊️', desc: 'Crisp precision ink' },
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
  sharpen: 0,
  vignette: 0,
  grain: 0,
  retouchSmooth: 0,
  flipH: false,
  flipV: false,
  filter: 'none',
};

// Clean isolated draft state interface to prevent ₹29 and ₹99 cross-contamination
interface PlanDraft {
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
  // Big Pop only
  imageUrl?: string;
  photoOpacity?: number;
  photoZoom?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  drawingDataUrl?: string | null;
  drawingOpacity?: number;
  // Advanced Canva/Photoshop-style Studio additions
  photoAdjustments?: PhotoAdjustments;
  layers?: SpotLayer[];
  isCurvedText?: boolean;
  curveRadius?: number;
  textStroke?: string;
  textGlow?: string;
  letterSpacing?: number;
}

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
    { id: 'mini_stk_1', emojiOrIcon: '♡', x: 135, y: 15, size: 26, rotation: 8, opacity: 1 },
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
  imageUrl: SAMPLE_PHOTOS[0].url,
  photoOpacity: 1,
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
  drawingDataUrl: null,
  drawingOpacity: 1,
  stickers: [
    { id: 'big_stk_1', emojiOrIcon: '💖', x: 200, y: 20, size: 30, rotation: -6, opacity: 1 },
    { id: 'big_stk_2', emojiOrIcon: '✨', x: 25, y: 25, size: 28, rotation: 12, opacity: 0.9 },
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
  const [activeEditorTab, setActiveEditorTab] = useState<'text' | 'adjust' | 'layers' | 'stickers' | 'draw' | 'frames' | 'themes'>('text');
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

  const handleAddShapeLayer = (shapeType: 'rectangle' | 'circle' | 'heart' | 'star' | 'arrow' | 'speech_bubble') => {
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
    const boundsW = tier === 'big_pop' ? 260 : 180;
    const boundsH = tier === 'big_pop' ? 320 : 180;
    const newStk: StickerItem = {
      id: newId,
      emojiOrIcon: emoji,
      x: Math.round(boundsW * 0.2 + Math.random() * (boundsW * 0.5)),
      y: Math.round(boundsH * 0.2 + Math.random() * (boundsH * 0.5)),
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
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateDraft({
          imageUrl: reader.result,
          photoZoom: 1,
          photoOffsetX: 0,
          photoOffsetY: 0,
        });
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
          imageUrl: currentDraft.imageUrl,
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
                onClick={() => setSelectedItemId(null)}
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
                    onSelectItem={setSelectedItemId}
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
                          width={tier === 'big_pop' ? 260 : 180}
                          height={tier === 'big_pop' ? 320 : 180}
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
                    : '👉 Tap any element (Headline, Subtext, Creator Tag, Photo, Sticker, Layer) to select. Drag anywhere to move freely. Pull corner to resize!'}
                </p>
              </div>

              {/* ACTIVE SELECTED ITEM FLOATING QUICK TOOLBAR */}
              {selectedItemId && (
                <div className="w-full mt-3 p-3.5 rounded-2xl bg-[#181B2A] border border-[#FF2E93]/40 shadow-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>✨</span>
                      <span>
                        {activeSelectedSticker
                          ? `Sticker: ${activeSelectedSticker.emojiOrIcon}`
                          : activeSelectedLayer
                          ? `Layer: ${activeSelectedLayer.name || activeSelectedLayer.type}`
                          : selectedItemId === 'headline'
                          ? 'Main Headline (Free Drag & Resize)'
                          : selectedItemId === 'subtext'
                          ? 'Subtext / Message (Free Drag & Resize)'
                          : selectedItemId === 'author'
                          ? 'Creator Tag (Free Drag & Resize)'
                          : selectedItemId === 'photo'
                          ? 'Photo Controls (Crop & Zoom)'
                          : 'Selected Item'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSelectedSticker) {
                          handleDeleteSticker(activeSelectedSticker.id);
                        } else if (activeSelectedLayer) {
                          handleDeleteLayer(activeSelectedLayer.id);
                        } else if (selectedItemId === 'subtext') {
                          updateDraft({ secondaryText: '' });
                          setSelectedItemId(null);
                        } else if (selectedItemId === 'photo') {
                          updateDraft({ imageUrl: undefined });
                          setSelectedItemId(null);
                        } else {
                          setSelectedItemId(null);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                    >
                      {activeSelectedSticker || activeSelectedLayer || selectedItemId === 'subtext' || selectedItemId === 'photo' ? '✕ Remove' : '✕ Deselect'}
                    </button>
                  </div>

                  {/* 0. LAYER QUICK CONTROLS: OPACITY, BLEND MODE, LOCK & DUPLICATE */}
                  {activeSelectedLayer && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Blend Mode</span>
                        <select
                          value={activeSelectedLayer.blendMode || 'normal'}
                          onChange={(e) => handleUpdateLayer(activeSelectedLayer.id, { blendMode: e.target.value as BlendMode })}
                          className="px-2 py-1 bg-black/60 border border-white/20 rounded-md text-white text-xs"
                        >
                          {BLEND_MODES.map(bm => (
                            <option key={bm.id} value={bm.id}>{bm.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Opacity ({Math.round((activeSelectedLayer.opacity ?? 1) * 100)}%)</span>
                        <input
                          type="range"
                          min={0.05}
                          max={1}
                          step={0.05}
                          value={activeSelectedLayer.opacity ?? 1}
                          onChange={(e) => handleUpdateLayer(activeSelectedLayer.id, { opacity: Number(e.target.value) })}
                          className="w-32 accent-[#00F0FF]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLayer(activeSelectedLayer.id, { locked: !activeSelectedLayer.locked })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            activeSelectedLayer.locked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {activeSelectedLayer.locked ? '🔒 Locked' : '🔓 Unlocked'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateLayer(activeSelectedLayer)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1"
                        >
                          📋 Duplicate Layer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1. STICKER QUICK CONTROLS: SIZE, OPACITY & ROTATE (NO ARROWS) */}
                  {activeSelectedSticker && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Size ({activeSelectedSticker.size}px)</span>
                        <input
                          type="range"
                          min={14}
                          max={72}
                          value={activeSelectedSticker.size}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { size: Number(e.target.value) })}
                          className="w-32 accent-[#FF2E93]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Opacity ({Math.round((activeSelectedSticker.opacity ?? 1) * 100)}%)</span>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={activeSelectedSticker.opacity ?? 1}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { opacity: Number(e.target.value) })}
                          className="w-32 accent-[#FF2E93]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Rotation ({activeSelectedSticker.rotation}°)</span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={activeSelectedSticker.rotation}
                          onChange={(e) => handleUpdateSticker(activeSelectedSticker.id, { rotation: Number(e.target.value) })}
                          className="w-32 accent-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. MAIN HEADLINE QUICK CONTROLS: DIRECT TEXT EDIT, FONT SIZE, OPACITY */}
                  {selectedItemId === 'headline' && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Edit Headline Text:
                        </label>
                        <input
                          type="text"
                          maxLength={48}
                          value={currentDraft.headline}
                          onChange={(e) => updateDraft({ headline: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:border-[#FF2E93] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Font Size ({currentDraft.fontSize}px)</span>
                        <input
                          type="range"
                          min={14}
                          max={46}
                          value={currentDraft.fontSize}
                          onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
                          className="w-32 accent-amber-400"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Opacity ({Math.round(currentDraft.textOpacity * 100)}%)</span>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={currentDraft.textOpacity}
                          onChange={(e) => updateDraft({ textOpacity: Number(e.target.value) })}
                          className="w-32 accent-amber-400"
                        />
                      </div>

                      {currentDraft.headlineX !== undefined && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => updateDraft({ headlineX: undefined, headlineY: undefined })}
                            className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                          >
                            Reset Position to Center
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. SUBTEXT QUICK CONTROLS: DIRECT TEXT EDIT, SIZE, OPACITY */}
                  {selectedItemId === 'subtext' && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Edit Subtext Note:
                        </label>
                        <input
                          type="text"
                          maxLength={70}
                          value={currentDraft.secondaryText}
                          onChange={(e) => updateDraft({ secondaryText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Subtext Size ({currentDraft.subtextSize || 14}px)</span>
                        <input
                          type="range"
                          min={10}
                          max={28}
                          value={currentDraft.subtextSize || 14}
                          onChange={(e) => updateDraft({ subtextSize: Number(e.target.value) })}
                          className="w-32 accent-amber-400"
                        />
                      </div>

                      {currentDraft.subtextX !== undefined && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => updateDraft({ subtextX: undefined, subtextY: undefined })}
                            className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                          >
                            Reset Position to Center
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. CREATOR TAG QUICK CONTROLS: EDIT NAME, SIZE, OPACITY */}
                  {selectedItemId === 'author' && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Edit Creator Name / Handle:
                        </label>
                        <input
                          type="text"
                          maxLength={24}
                          value={currentDraft.creatorName}
                          onChange={(e) => updateDraft({ creatorName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Tag Size ({currentDraft.authorSize || 11}px)</span>
                        <input
                          type="range"
                          min={9}
                          max={22}
                          value={currentDraft.authorSize || 11}
                          onChange={(e) => updateDraft({ authorSize: Number(e.target.value) })}
                          className="w-32 accent-cyan-400"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Tag Opacity ({Math.round((currentDraft.authorOpacity ?? currentDraft.textOpacity) * 100)}%)</span>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={currentDraft.authorOpacity ?? currentDraft.textOpacity}
                          onChange={(e) => updateDraft({ authorOpacity: Number(e.target.value) })}
                          className="w-32 accent-cyan-400"
                        />
                      </div>

                      {currentDraft.authorX !== undefined && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => updateDraft({ authorX: undefined, authorY: undefined })}
                            className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                          >
                            Reset Tag to Bottom Footer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. PHOTO QUICK CONTROLS: ZOOM & OPACITY (BIG POP) */}
                  {selectedItemId === 'photo' && tier === 'big_pop' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Zoom & Crop ({Math.round((currentDraft.photoZoom ?? 1) * 100)}%)</span>
                        <input
                          type="range"
                          min={1}
                          max={2.5}
                          step={0.1}
                          value={currentDraft.photoZoom ?? 1}
                          onChange={(e) => updateDraft({ photoZoom: Number(e.target.value) })}
                          className="w-32 accent-[#FF2E93]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Photo Opacity ({Math.round((currentDraft.photoOpacity ?? 1) * 100)}%)</span>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={currentDraft.photoOpacity ?? 1}
                          onChange={(e) => updateDraft({ photoOpacity: Number(e.target.value) })}
                          className="w-32 accent-[#FF2E93]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT / BOTTOM: STUDIO TOOLS ACCORDION TABS */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* Tool Navigation Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
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
                  <span>Text & Fonts</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('adjust');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'adjust' && !isDrawingMode
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📸</span>
                  <span>Adjust & Filters</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('layers');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'layers' && !isDrawingMode
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📚</span>
                  <span>Layers</span>
                  {currentDraft.layers && currentDraft.layers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-200 text-[10px] flex items-center justify-center font-mono">
                      {currentDraft.layers.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveEditorTab('stickers');
                    setIsDrawingMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeEditorTab === 'stickers' && !isDrawingMode
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>💖</span>
                  <span>Stickers & Stamps</span>
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
                  <span>Draw & Shapes</span>
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
                  <span>Frames & Shape</span>
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
                  <span>🎨</span>
                  <span>Themes & BG</span>
                </button>
              </div>

              {/* TAB 1: TEXT & FONTS (ULTRA-MODERN INTERACTIVE REDESIGN) */}
              {activeEditorTab === 'text' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* 1. Main Headline Input Card */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-[#FF2E93] border border-pink-500/30 flex items-center justify-center text-xs">
                          💬
                        </span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Main Headline / Message
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentDraft.headline && (
                          <button
                            type="button"
                            onClick={() => updateDraft({ headline: '' })}
                            className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
                          >
                            ✕ Clear
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currentDraft.headline.length}/48
                        </span>
                      </div>
                    </div>

                    <div className="relative rounded-xl bg-black/60 border border-white/15 focus-within:border-[#FF2E93] focus-within:ring-2 focus-within:ring-[#FF2E93]/30 transition-all overflow-hidden">
                      <input
                        type="text"
                        maxLength={48}
                        value={currentDraft.headline}
                        onChange={(e) => updateDraft({ headline: e.target.value })}
                        placeholder="e.g. My Memory ♡ or Living My Best Life"
                        className="w-full px-3.5 py-2.5 bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
                      />
                    </div>

                    {/* Interactive Inspiration Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Quick ideas:</span>
                      {[
                        'My Memory ♡',
                        'Good Vibes Only ✨',
                        'Forever & Always 💕',
                        'Living Life in Full Color 🌈',
                        'To The Moon 🚀',
                        'King Energy 👑',
                        'Art ♡',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateDraft({ headline: preset })}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-pink-500/20 hover:text-pink-300 border border-white/10 text-slate-300 text-[10px] font-medium transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Subtext / Personal Note Card */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs">
                          📝
                        </span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Subtext / Personal Note
                        </label>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-bold">
                          Optional
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentDraft.secondaryText && (
                          <button
                            type="button"
                            onClick={() => updateDraft({ secondaryText: '' })}
                            className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
                          >
                            ✕ Clear
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currentDraft.secondaryText.length}/70
                        </span>
                      </div>
                    </div>

                    <div className="relative rounded-xl bg-black/60 border border-white/15 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-all overflow-hidden">
                      <input
                        type="text"
                        maxLength={70}
                        value={currentDraft.secondaryText}
                        onChange={(e) => updateDraft({ secondaryText: e.target.value })}
                        placeholder="e.g. Living life in full color or Since 2024"
                        className="w-full px-3.5 py-2.5 bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
                      />
                    </div>

                    {/* Quick Subtext Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Quick notes:</span>
                      {[
                        'Living life in full color.',
                        'Claimed on SpotPop 2026',
                        'Since 2024 ♡',
                        'Best memories are made together.',
                        'Catch flights, not feelings.',
                        'Made with love ✨',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateDraft({ secondaryText: preset })}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-slate-300 text-[10px] font-medium transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Creator Tag / Signature Card */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs">
                          🏷️
                        </span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Creator Tag / Signature
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentDraft.creatorName.length}/24
                      </span>
                    </div>

                    <div className="flex items-center rounded-xl bg-black/60 border border-white/15 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30 transition-all overflow-hidden">
                      <span className="px-3 text-cyan-400 font-bold text-sm select-none">@</span>
                      <input
                        type="text"
                        maxLength={24}
                        value={currentDraft.creatorName}
                        onChange={(e) => updateDraft({ creatorName: e.target.value })}
                        placeholder="YourNameOrHandle"
                        className="w-full pr-3.5 py-2.5 bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
                      />
                    </div>

                    {/* Quick Tag Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Tag presets:</span>
                      {['Spot Pioneer', 'Anonymous ♡', 'VIP Creator', 'Founder #1', 'With Love ♡'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => updateDraft({ creatorName: tag })}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 text-slate-300 text-[10px] font-medium transition-colors"
                        >
                          @{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Font Typography (Visual Font Selector) */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs">
                          ✍️
                        </span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Font Typography ({ALL_FONTS.length} Curated Fonts)
                        </label>
                      </div>
                      <span className="text-[11px] text-[#FF2E93] font-bold font-mono">
                        {currentDraft.fontFamily}
                      </span>
                    </div>

                    {/* Font Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                      {['All', 'Handwritten', 'Modern', 'Display', 'Retro', 'Serif'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedFontCategory(cat)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors ${
                            selectedFontCategory === cat
                              ? 'bg-[#FF2E93] text-white shadow-xs'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Visual Font Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto no-scrollbar p-1 bg-black/30 rounded-xl border border-white/5">
                      {filteredFonts.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateDraft({ fontFamily: f.id })}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            currentDraft.fontFamily === f.id
                              ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white ring-1 ring-[#FF2E93]'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 font-sans truncate">{f.name.split(' (')[0]}</div>
                          <div
                            className="text-sm font-bold truncate mt-0.5 text-white"
                            style={{ fontFamily: f.family }}
                          >
                            {currentDraft.headline || 'Hello World'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Color & Text Opacity Styling Bar */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs">
                        🎨
                      </span>
                      <label className="text-xs font-bold text-white tracking-wide">
                        Text Color & Legibility
                      </label>
                    </div>

                    {/* Color Presets Palette */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {[
                        { color: '#FFFFFF', label: 'White' },
                        { color: '#0F172A', label: 'Black' },
                        { color: '#FF2E93', label: 'Pink' },
                        { color: '#FFB800', label: 'Gold' },
                        { color: '#00F0FF', label: 'Cyan' },
                        { color: '#10B981', label: 'Green' },
                        { color: '#8B5CF6', label: 'Purple' },
                        { color: '#EF4444', label: 'Red' },
                        { color: '#FBCFE8', label: 'Pastel' },
                      ].map((cp) => (
                        <button
                          key={cp.color}
                          type="button"
                          onClick={() => updateDraft({ textColor: cp.color })}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            currentDraft.textColor === cp.color
                              ? 'scale-125 border-white ring-2 ring-[#FF2E93] shadow-md'
                              : 'border-white/20 hover:scale-110'
                          }`}
                          style={{ backgroundColor: cp.color }}
                          title={cp.label}
                        />
                      ))}

                      {/* Custom Color Input */}
                      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/15">
                        <input
                          type="color"
                          value={currentDraft.textColor}
                          onChange={(e) => updateDraft({ textColor: e.target.value })}
                          className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                          title="Custom Hex Picker"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {currentDraft.textColor}
                        </span>
                      </div>
                    </div>

                    {/* Opacity & Alignment Controls */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                          <span>Text Opacity</span>
                          <span className="font-mono text-[#FF2E93] font-bold">
                            {Math.round(currentDraft.textOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={currentDraft.textOpacity}
                          onChange={(e) => updateDraft({ textOpacity: Number(e.target.value) })}
                          className="w-full accent-[#FF2E93]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                          <span>Font Size</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {currentDraft.fontSize}px
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDraft({ fontSize: Math.max(14, currentDraft.fontSize - 2) })}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min={14}
                            max={46}
                            value={currentDraft.fontSize}
                            onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
                            className="w-full accent-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => updateDraft({ fontSize: Math.min(46, currentDraft.fontSize + 2) })}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Curved Text & Letter Spacing Box */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-[#FF2E93] border border-pink-500/30 flex items-center justify-center text-xs">
                          📐
                        </span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Curved / Arched Text & Letter Spacing
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateDraft({ isCurvedText: !currentDraft.isCurvedText })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          currentDraft.isCurvedText
                            ? 'bg-[#FF2E93] text-white shadow-md'
                            : 'bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {currentDraft.isCurvedText ? '🌈 Curved: ON' : 'Straight: OFF'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                      <span>Letter Spacing ({currentDraft.letterSpacing || 0}px)</span>
                      <input
                        type="range"
                        min={-2}
                        max={10}
                        step={1}
                        value={currentDraft.letterSpacing || 0}
                        onChange={(e) => updateDraft({ letterSpacing: Number(e.target.value) })}
                        className="w-36 accent-[#FF2E93]"
                      />
                    </div>
                  </div>

                  {/* 7. AI Writer & AI Captions Assistant */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1E112A] to-[#12141F] border border-purple-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🪄</span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          AI Writer & Viral Captions
                        </label>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                        1-Tap Insert
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar p-1">
                      {AI_CAPTION_PRESETS.map((catGroup) => (
                        <div key={catGroup.category} className="space-y-1.5">
                          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                            <span>{catGroup.icon}</span>
                            <span>{catGroup.category}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {catGroup.captions.map((cap) => (
                              <button
                                key={cap}
                                type="button"
                                onClick={() => updateDraft({ headline: cap })}
                                className="p-2 rounded-lg bg-black/40 hover:bg-purple-600/20 border border-white/10 hover:border-purple-400 text-left text-slate-200 text-xs font-medium transition-all group"
                              >
                                <span className="group-hover:text-purple-300 leading-snug block">"{cap}"</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FRAMES & CARD SHAPES (NEW DEDICATED FORMAT & FRAME SELECTOR) */}
              {activeEditorTab === 'frames' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* Hero Callout for Transparent Cutout Mode */}
                  <div
                    onClick={() => handleSelectShape(AVAILABLE_SHAPES[0])}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      currentDraft.shape === 'transparent'
                        ? 'border-[#FF2E93] bg-gradient-to-r from-[#FF2E93]/20 via-purple-600/20 to-cyan-500/20 shadow-lg ring-2 ring-[#FF2E93]'
                        : 'border-white/15 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl filter drop-shadow">🌟</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Transparent Cutout Mode (PNG Only)</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-purple-600 text-[9px] font-black uppercase text-white tracking-wider">
                              No Card Background
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Completely removes sticky note & card frames! Your uploaded PNG artwork, stickers & doodles float directly on the canvas.
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                          currentDraft.shape === 'transparent' ? 'border-[#FF2E93] bg-[#FF2E93] text-white' : 'border-white/40'
                        }`}>
                          {currentDraft.shape === 'transparent' ? '✓' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* All 11 Frame Shapes Grid */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Card Formats & Frame Styles ({AVAILABLE_SHAPES.length} Choices)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto no-scrollbar p-1">
                      {AVAILABLE_SHAPES.map((shapeOpt) => {
                        const isSelected = currentDraft.shape === shapeOpt.id;
                        return (
                          <button
                            key={shapeOpt.id}
                            type="button"
                            onClick={() => handleSelectShape(shapeOpt)}
                            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#FF2E93] bg-[#FF2E93]/15 text-white ring-2 ring-[#FF2E93]/60 shadow-md scale-102'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xl filter drop-shadow">{shapeOpt.icon}</span>
                              {shapeOpt.badge && (
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-white/10 text-white font-bold">
                                  {shapeOpt.badge}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate">{shapeOpt.name}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                                {shapeOpt.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fasteners & Frame Accents */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Fastener & Border Accents
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(tier === 'big_pop' ? BIG_FRAMES : MINI_FRAMES).map((fr) => (
                        <button
                          key={fr.id}
                          type="button"
                          onClick={() => updateDraft({ frameStyle: fr.id })}
                          className={`p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                            currentDraft.frameStyle === fr.id
                              ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-sm ring-1 ring-[#FF2E93]'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {fr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: THEMES & BACKGROUND PALETTES */}
              {activeEditorTab === 'themes' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'all', label: 'All Themes' },
                      { id: 'halloween', label: '🎃 Halloween' },
                      { id: 'christmas', label: '🎄 Christmas' },
                      { id: 'love', label: '💖 Love' },
                      { id: 'retro', label: '⚡ Cosmic/Retro' },
                      { id: 'classic', label: '📝 Classics' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedBgCategory(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          selectedBgCategory === tab.id
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Background Palette Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300">
                        Background Palette ({filteredBackgrounds.length} Themes)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Applies directly to your active spot
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 bg-black/30 rounded-xl border border-white/5 no-scrollbar">
                      {filteredBackgrounds.map((bg, idx) => {
                        const isSelected = currentDraft.backgroundColor === bg.value;
                        const isBgTransparent = bg.value === 'transparent';

                        return (
                          <button
                            key={`${bg.name}_${idx}`}
                            type="button"
                            onClick={() => handleSelectBackground(bg)}
                            className={`h-16 rounded-xl p-2 border flex flex-col justify-end text-left transition-all relative overflow-hidden ${
                              isSelected
                                ? 'border-[#FF2E93] ring-2 ring-[#FF2E93]/60 scale-102 shadow-lg'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            style={{
                              background: isBgTransparent ? 'repeating-conic-gradient(#334155 0% 25%, #1E293B 0% 50%) 50% / 12px 12px' : bg.value,
                            }}
                          >
                            <span
                              className="text-[10px] font-bold truncate drop-shadow-md z-10"
                              style={{ color: isBgTransparent ? '#FFFFFF' : bg.text }}
                            >
                              {bg.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF2E93] text-white flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ADJUST & FILTERS (CANVA/PHOTOSHOP-GRADE PHOTO SUITE) */}
              {activeEditorTab === 'adjust' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* Upload / Replace Primary Artwork */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📸</span>
                        <label className="text-xs font-bold text-white tracking-wide">
                          Spot Main Artwork & Photo
                        </label>
                      </div>
                      <label className="px-3 py-1.5 rounded-xl bg-[#FF2E93] hover:bg-[#E6007A] text-white text-xs font-bold cursor-pointer transition-colors shadow-md">
                        {currentDraft.imageUrl ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Preset Aesthetics Gallery */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {SAMPLE_PHOTOS.map(sp => (
                        <div
                          key={sp.label}
                          onClick={() => updateDraft({ imageUrl: sp.url, photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
                          className={`aspect-square rounded-xl overflow-hidden border cursor-pointer transition-transform hover:scale-105 ${
                            currentDraft.imageUrl === sp.url ? 'border-[#FF2E93] ring-2 ring-[#FF2E93]/50' : 'border-white/10'
                          }`}
                        >
                          <img src={sp.url} alt={sp.label} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transform / Quick Rotate & Flip Bar */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Transform & Orientation
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ flipH: !currentDraft.photoAdjustments?.flipH })}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          currentDraft.photoAdjustments?.flipH ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        <span>↔️</span>
                        <span>Flip H</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ flipV: !currentDraft.photoAdjustments?.flipV })}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          currentDraft.photoAdjustments?.flipV ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        <span>↕️</span>
                        <span>Flip V</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePhotoAdjustments({ ...DEFAULT_ADJUSTMENTS })}
                        className="py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>↺</span>
                        <span>Reset All</span>
                      </button>
                    </div>
                  </div>

                  {/* 10 Filter Preset Chips */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white tracking-wide">
                        Color Grading & Filter Presets
                      </label>
                      <span className="text-[10px] text-pink-400 font-bold uppercase">
                        {currentDraft.photoAdjustments?.filter || 'Normal'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {FILTER_PRESETS.map((fp) => {
                        const isSelected = (currentDraft.photoAdjustments?.filter || 'none') === fp.id;
                        return (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => updatePhotoAdjustments({ filter: fp.id })}
                            className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                              isSelected
                                ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white ring-1 ring-[#FF2E93] shadow-md scale-102'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <span className="text-base">{fp.icon}</span>
                            <span className="text-[11px] font-bold mt-1 truncate w-full">{fp.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Crop / Zoom & Pan Position */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">
                      Crop / Zoom & Alignment
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Crop / Zoom Scale ({Math.round((currentDraft.photoZoom ?? 1) * 100)}%)</span>
                        <input
                          type="range"
                          min={0.5}
                          max={2.5}
                          step={0.05}
                          value={currentDraft.photoZoom ?? 1}
                          onChange={(e) => updateDraft({ photoZoom: Number(e.target.value) })}
                          className="w-40 accent-[#FF2E93]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Horizontal Pan ({currentDraft.photoOffsetX ?? 0}px)</span>
                        <input
                          type="range"
                          min={-70}
                          max={70}
                          value={currentDraft.photoOffsetX ?? 0}
                          onChange={(e) => updateDraft({ photoOffsetX: Number(e.target.value) })}
                          className="w-40 accent-[#FF2E93]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Vertical Pan ({currentDraft.photoOffsetY ?? 0}px)</span>
                        <input
                          type="range"
                          min={-70}
                          max={70}
                          value={currentDraft.photoOffsetY ?? 0}
                          onChange={(e) => updateDraft({ photoOffsetY: Number(e.target.value) })}
                          className="w-40 accent-[#FF2E93]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fine Tune Sliders */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">
                      Fine Tune & Pro Adjustments
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Brightness</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.brightness || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={currentDraft.photoAdjustments?.brightness || 0}
                          onChange={(e) => updatePhotoAdjustments({ brightness: Number(e.target.value) })}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Contrast</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.contrast || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={currentDraft.photoAdjustments?.contrast || 0}
                          onChange={(e) => updatePhotoAdjustments({ contrast: Number(e.target.value) })}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Saturation</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.saturation || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={currentDraft.photoAdjustments?.saturation || 0}
                          onChange={(e) => updatePhotoAdjustments({ saturation: Number(e.target.value) })}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Exposure</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.exposure || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={currentDraft.photoAdjustments?.exposure || 0}
                          onChange={(e) => updatePhotoAdjustments({ exposure: Number(e.target.value) })}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Temperature (Warmth)</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.temperature || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={currentDraft.photoAdjustments?.temperature || 0}
                          onChange={(e) => updatePhotoAdjustments({ temperature: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Hue Rotation</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.hue || 0}°</span>
                        </div>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={currentDraft.photoAdjustments?.hue || 0}
                          onChange={(e) => updatePhotoAdjustments({ hue: Number(e.target.value) })}
                          className="w-full accent-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Blur</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.blur || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={currentDraft.photoAdjustments?.blur || 0}
                          onChange={(e) => updatePhotoAdjustments({ blur: Number(e.target.value) })}
                          className="w-full accent-purple-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Skin Smooth & Radiance</span>
                          <span className="font-mono">{currentDraft.photoAdjustments?.retouchSmooth || 0}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={currentDraft.photoAdjustments?.retouchSmooth || 0}
                          onChange={(e) => updatePhotoAdjustments({ retouchSmooth: Number(e.target.value) })}
                          className="w-full accent-rose-400"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Photo Opacity</span>
                          <span className="font-mono">{Math.round((currentDraft.photoOpacity ?? 1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={currentDraft.photoOpacity ?? 1}
                          onChange={(e) => updateDraft({ photoOpacity: Number(e.target.value) })}
                          className="w-full accent-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: LAYERS STUDIO & MULTI-PHOTO (UNLIMITED LAYERS) */}
              {activeEditorTab === 'layers' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* Action Bar: Add Photo, Add Shape, Add Text */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <label className="text-xs font-bold text-white block">
                      Add Extra Elements / Multi-Photo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="py-2 px-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors text-center">
                        <span>+ 📸 Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomStickerUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddTextLayer('New Text Layer')}
                        className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                      >
                        <span>+ ✍️ Text</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddShapeLayer('heart')}
                        className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                      >
                        <span>+ 💖 Shape</span>
                      </button>
                    </div>

                    {/* Quick Shapes Palette */}
                    <div className="pt-2 border-t border-white/10">
                      <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                        Insert Vector Shape:
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                          { id: 'heart', label: 'Heart', icon: '💖' },
                          { id: 'star', label: 'Star', icon: '⭐' },
                          { id: 'circle', label: 'Circle', icon: '⭕' },
                          { id: 'rectangle', label: 'Box', icon: '⬛' },
                          { id: 'arrow', label: 'Arrow', icon: '➡️' },
                          { id: 'speech_bubble', label: 'Bubble', icon: '💬' },
                        ].map(shp => (
                          <button
                            key={shp.id}
                            type="button"
                            onClick={() => handleAddShapeLayer(shp.id as any)}
                            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <span>{shp.icon}</span>
                            <span>{shp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Layer Stack Manager */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Layer Stack</span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          ({(currentDraft.layers || []).length} Layers)
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Top = Front · Bottom = Back
                      </span>
                    </div>

                    {(currentDraft.layers || []).length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-white/15 text-center text-slate-400 space-y-1">
                        <p className="text-xs">No extra layers added yet.</p>
                        <p className="text-[11px] text-slate-500">Tap + Photo, + Text, or + Shape to add unlimited overlay elements!</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar p-1">
                        {[...(currentDraft.layers || [])].reverse().map((layer) => {
                          const isSelected = selectedItemId === layer.id;

                          return (
                            <div
                              key={layer.id}
                              onClick={() => setSelectedItemId(layer.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-md'
                                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm">
                                  {layer.type === 'image' ? '📸' : layer.type === 'text' ? '✍️' : '🔷'}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">{layer.name || layer.type}</p>
                                  <p className="text-[10px] text-slate-400 capitalize">{layer.blendMode || 'normal'} · {Math.round((layer.opacity ?? 1) * 100)}%</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLayer(layer.id, { locked: !layer.locked })}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                                    layer.locked ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white'
                                  }`}
                                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                                >
                                  {layer.locked ? '🔒' : '🔓'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateLayer(layer.id, { visible: layer.visible === false ? true : false })}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                  title={layer.visible === false ? 'Show Layer' : 'Hide Layer'}
                                >
                                  {layer.visible === false ? '🕶️' : '👁️'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReorderLayer(layer.id, 'up')}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                  title="Bring Forward"
                                >
                                  ⬆️
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReorderLayer(layer.id, 'down')}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                  title="Send Backward"
                                >
                                  ⬇️
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateLayer(layer)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                  title="Duplicate Layer"
                                >
                                  📋
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLayer(layer.id)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-rose-400 hover:bg-rose-500/20"
                                  title="Delete Layer"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: STICKERS & GRAPHICS LIBRARY */}
              {activeEditorTab === 'stickers' && !isDrawingMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141724] to-[#0E101A] border border-white/10 space-y-4 shadow-xl">
                  {/* Search & Custom Upload Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={stickerSearchQuery}
                          onChange={(e) => setStickerSearchQuery(e.target.value)}
                          placeholder="Search stickers, stamps, emojis..."
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF2E93]"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                        {stickerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStickerSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <label className="px-3 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm">
                        <span>+ Custom PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomStickerUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* AI Sticker Generator Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={aiStickerPrompt}
                        onChange={(e) => setAiStickerPrompt(e.target.value)}
                        placeholder="AI Tag: Type any vibe (e.g. Neon Soulmate, 2026 Forever)..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAiStickerCreate();
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAiStickerCreate}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shrink-0 hover:opacity-90"
                      >
                        🪄 Stamp Tag
                      </button>
                    </div>
                  </div>

                  {/* Sticker Category Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    {STICKER_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setStickerCategory(cat.id);
                          setStickerSearchQuery('');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          stickerCategory === cat.id && !stickerSearchQuery
                            ? 'bg-[#FF2E93] text-white shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Stickers Grid */}
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto no-scrollbar p-1">
                      {STICKER_CATEGORIES.flatMap(c => {
                        if (stickerSearchQuery) {
                          return c.emojis.filter(e => e.toLowerCase().includes(stickerSearchQuery.toLowerCase()));
                        }
                        return c.id === stickerCategory ? c.emojis : [];
                      }).map((em, idx) => (
                        <button
                          key={`${em}_${idx}`}
                          type="button"
                          onClick={() => handleAddSticker(em)}
                          className="min-h-[44px] rounded-xl bg-white/5 hover:bg-[#FF2E93]/20 border border-white/10 hover:border-[#FF2E93] flex items-center justify-center p-1.5 hover:scale-105 transition-transform"
                        >
                          <span className="select-none truncate text-center font-bold text-xs text-white drop-shadow-sm">{em}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DRAW STUDIO & SHAPES (MOBILE & DESKTOP FRIENDLY) */}
              {(isDrawingMode || activeEditorTab === 'draw') && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1A112C] to-[#12141F] border border-pink-500/30 space-y-3.5 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">🖌️</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Full-Space Drawing & Brush Studio
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUndoDrawing}
                        disabled={drawingHistory.length === 0}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        ↩ Undo
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDrawing}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                      {isDrawingMode ? (
                        <button
                          type="button"
                          onClick={() => setIsDrawingMode(false)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          ✓ Done Drawing
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDrawingMode(true);
                            setSelectedItemId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#FF2E93] hover:bg-[#FF1493] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          ✏️ Start Sketching
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 8 Brush Styles */}
                  <div>
                    <label className="block text-[11px] font-bold text-pink-300 mb-1.5 uppercase">
                      Select Pen / Brush Style:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BRUSH_STYLES.map(brush => (
                        <button
                          key={brush.id}
                          type="button"
                          onClick={() => setDrawTool(brush.id)}
                          className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                            drawTool === brush.id
                              ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white shadow-md scale-102 ring-1 ring-[#FF2E93]'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <span className="text-lg">{brush.icon}</span>
                          <span className="text-[11px] font-bold mt-0.5">{brush.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brush Size & Opacity */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Brush Size</span>
                        <span className="font-bold text-[#FF2E93]">{brushSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={36}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="accent-[#FF2E93]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Pen Opacity</span>
                        <span className="font-bold text-[#FF2E93]">{Math.round(brushOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={brushOpacity}
                        onChange={(e) => setBrushOpacity(Number(e.target.value))}
                        className="accent-[#FF2E93]"
                      />
                    </div>
                  </div>

                  {/* Color Palette */}
                  {drawTool !== 'eraser' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-300">Ink Color Palette:</span>
                        <input
                          type="color"
                          value={drawColor}
                          onChange={(e) => setDrawColor(e.target.value)}
                          className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {[
                          '#FF2E93', '#FFE600', '#00F0FF', '#76FF03', '#FFFFFF',
                          '#9333EA', '#FF5722', '#000000', '#FF1493', '#00E5FF'
                        ].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setDrawColor(c)}
                            className={`w-7 h-7 rounded-full shrink-0 border-2 transition-transform hover:scale-110 ${
                              drawColor === c ? 'border-white scale-115 ring-2 ring-[#FF2E93]' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vector Shape Stamps Section */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-pink-300 uppercase tracking-wider">
                        🔷 Or Stamp Vector Shape Layers:
                      </span>
                      <span className="text-[10px] text-slate-400">Adds resizable layer</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[
                        { type: 'heart', label: 'Heart', icon: '❤️' },
                        { type: 'star', label: 'Star', icon: '⭐' },
                        { type: 'circle', label: 'Circle', icon: '⭕' },
                        { type: 'rectangle', label: 'Box', icon: '⬛' },
                        { type: 'arrow', label: 'Arrow', icon: '➡️' },
                        { type: 'speech_bubble', label: 'Bubble', icon: '💬' },
                      ].map((shp) => (
                        <button
                          key={shp.type}
                          type="button"
                          onClick={() => {
                            handleAddShapeLayer(shp.type as any);
                            setIsDrawingMode(false);
                          }}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-[#FF2E93]/20 border border-white/10 hover:border-[#FF2E93] flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-105"
                        >
                          <span className="text-base">{shp.icon}</span>
                          <span className="text-[9px] font-bold text-slate-300 mt-0.5 truncate w-full">{shp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
