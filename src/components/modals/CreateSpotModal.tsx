import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ProductTier, PRODUCTS, Spot, SpotShape, FrameStyle, StickerItem, SpotLayer, PhotoAdjustments, BlendMode, SpotAudio } from '../../types';
import { api } from '../../services/api';
import { checkImageSafety } from '../../services/nsfwSafety';
import { prepareImageForUpload } from '../../services/imageOptimizer';
import { SpotCard } from '../canvas/SpotCard';
import { SpotPopLogo } from '../brand/SpotPopLogo';
import { PhotoCropTab } from './editor/PhotoCropTab';
import { AdjustTab } from './editor/AdjustTab';
import { RetouchTab } from './editor/RetouchTab';
import { TextStudioTab } from './editor/TextStudioTab';
import { StickersStockTab } from './editor/StickersStockTab';
import { DrawStudioTab } from './editor/DrawStudioTab';
import { FramesTab } from './editor/FramesTab';
import { ThemesTab } from './editor/ThemesTab';
import { AudioStudioTab } from './editor/AudioStudioTab';
import { AudienceTab } from './editor/AudienceTab';
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
  editSpot?: Spot | null;
  authToken?: string | null;
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

// Frame Styles & Accents with Seasons & Festivals
export interface FrameAccentItem {
  id: FrameStyle;
  label: string;
  category: 'classic' | 'seasons' | 'festivals' | 'aesthetic';
  animated?: boolean;
}

export const ALL_FRAME_ACCENTS: FrameAccentItem[] = [
  // Classic Hanging Tapes & Pins
  { id: 'tape', label: '🩹 Scotch Tape', category: 'classic' },
  { id: 'pin', label: '📌 Push Pin', category: 'classic' },
  { id: 'binder_clip', label: '📎 Binder Clip', category: 'classic' },
  { id: 'duct_tape', label: '🧲 Duct Tape', category: 'classic' },
  { id: 'washi', label: '🎀 Artisan Washi', category: 'classic' },
  { id: 'film_strip', label: '🎞️ 35mm Film', category: 'classic' },
  { id: 'stamp', label: '📮 Vintage Stamp', category: 'classic' },
  { id: 'comic', label: '💥 Comic Halftone', category: 'classic' },
  { id: 'none', label: '✨ Borderless', category: 'classic' },

  // Every Season
  { id: 'spring_blossom', label: '🌸 Spring Blossom', category: 'seasons', animated: true },
  { id: 'summer_sun', label: '☀️ Tropical Summer', category: 'seasons', animated: true },
  { id: 'autumn_leaves', label: '🍁 Autumn Leaves', category: 'seasons', animated: true },
  { id: 'winter_frost', label: '❄️ Winter Frost', category: 'seasons', animated: true },

  // Festivals & Holidays
  { id: 'christmas_lights', label: '🎄 Christmas Lights', category: 'festivals', animated: true },
  { id: 'halloween_bat', label: '🎃 Halloween Spooky', category: 'festivals', animated: true },
  { id: 'diwali_diya', label: '🪔 Diwali Diyas', category: 'festivals', animated: true },
  { id: 'new_year_sparkle', label: '🎆 New Year Sparkle', category: 'festivals', animated: true },
  { id: 'valentine_hearts', label: '💖 Valentine Hearts', category: 'festivals', animated: true },
  { id: 'birthday_bunting', label: '🎂 Birthday Party', category: 'festivals', animated: true },
  { id: 'ramadan_crescent', label: '🌙 Ramadan Crescent', category: 'festivals', animated: true },
  { id: 'holi_colors', label: '🎨 Holi Color Splash', category: 'festivals' },
  { id: 'lucky_clover', label: '🍀 Lucky Clover', category: 'festivals', animated: true },

  // Aesthetic & Animated
  { id: 'gold_crown', label: '👑 Royal Crown', category: 'aesthetic', animated: true },
  { id: 'neon', label: '⚡ Neon Cyber Glow', category: 'aesthetic', animated: true },
  { id: 'cyber_pulse', label: '👾 Glitch Laser', category: 'aesthetic', animated: true },
  { id: 'rainbow_holo', label: '🌈 Rainbow Holo', category: 'aesthetic', animated: true },
  { id: 'cat_paws', label: '🐱 Kitty Paws', category: 'aesthetic', animated: true },
  { id: 'golden_ribbon', label: '🎗️ Golden Ribbon', category: 'aesthetic' },
];

export const MINI_FRAMES = ALL_FRAME_ACCENTS;
export const BIG_FRAMES = ALL_FRAME_ACCENTS;

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
  headline: '',
  secondaryText: '',
  creatorName: '',
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
  title: '',
  description: '',
  location: '',
  tags: [],
  taggedUsers: [],
  connectedSpotIds: [],
};

const DEFAULT_BIG_DRAFT: PlanDraft = {
  headline: '',
  secondaryText: '',
  creatorName: '',
  fontFamily: 'Caveat',
  fontSize: 22,
  textColor: '#0F172A',
  textOpacity: 1,
  alignment: 'center',
  backgroundColor: '#FFFFFF',
  frameStyle: 'tape',
  shape: 'polaroid',
  imageUrl: DEFAULT_SPOT_PHOTO,
  imageFit: 'cover',
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
  title: '',
  description: '',
  location: '',
  tags: [],
  taggedUsers: [],
  connectedSpotIds: [],
};

export const CreateSpotModal: React.FC<CreateSpotModalProps> = ({
  isOpen,
  onClose,
  initialTier,
  onSuccess,
  editSpot,
  authToken,
}) => {
  // Modal Step
  const [step, setStep] = useState<'tier' | 'editor' | 'checkout' | 'processing'>('editor');
  const [tier, setTier] = useState<ProductTier>(editSpot ? editSpot.tier : initialTier);

  // COMPLETELY ISOLATED DRAFTS TO PREVENT LEAKING BETWEEN PLANS
  const [miniDraft, setMiniDraft] = useState<PlanDraft>(DEFAULT_MINI_DRAFT);
  const [bigDraft, setBigDraft] = useState<PlanDraft>(DEFAULT_BIG_DRAFT);

  // Populate from editSpot when opened in edit mode
  useEffect(() => {
    if (editSpot) {
      setTier(editSpot.tier);
      const draft: PlanDraft = {
        headline: editSpot.content?.headline || '',
        headlineX: editSpot.content?.headlineX,
        headlineY: editSpot.content?.headlineY,
        secondaryText: editSpot.content?.text || '',
        subtextX: editSpot.content?.subtextX,
        subtextY: editSpot.content?.subtextY,
        subtextSize: editSpot.content?.subtextSize,
        subtextFontFamily: editSpot.content?.subtextFontFamily,
        subtextColor: editSpot.content?.subtextColor,
        subtextOpacity: editSpot.content?.subtextOpacity,
        subtextStroke: editSpot.content?.subtextStroke,
        subtextGlow: editSpot.content?.subtextGlow,
        subtext3D: editSpot.content?.subtext3D,
        subtextGradient: editSpot.content?.subtextGradient,
        subtextLetterSpacing: editSpot.content?.subtextLetterSpacing,
        creatorName: editSpot.content?.author !== undefined ? editSpot.content.author : (editSpot.creatorName || ''),
        authorX: editSpot.content?.authorX,
        authorY: editSpot.content?.authorY,
        authorSize: editSpot.content?.authorSize,
        authorOpacity: editSpot.content?.authorOpacity,
        authorFontFamily: editSpot.content?.authorFontFamily,
        authorColor: editSpot.content?.authorColor,
        authorStroke: editSpot.content?.authorStroke,
        authorGlow: editSpot.content?.authorGlow,
        author3D: editSpot.content?.author3D,
        fontFamily: editSpot.content?.fontFamily || 'Caveat',
        fontSize: editSpot.content?.fontSize || 22,
        textColor: editSpot.content?.textColor || '#1E293B',
        textOpacity: editSpot.content?.textOpacity ?? 1,
        alignment: editSpot.content?.alignment || 'center',
        backgroundColor: editSpot.background || '#FEF08A',
        frameStyle: editSpot.content?.frameStyle || 'tape',
        shape: editSpot.shape || 'sticky',
        imageUrl: editSpot.content?.imageUrl,
        imageFit: editSpot.content?.imageFit || 'cover',
        photoOpacity: editSpot.content?.photoOpacity ?? 1,
        photoZoom: editSpot.content?.photoZoom ?? 1,
        photoOffsetX: editSpot.content?.photoOffsetX ?? 0,
        photoOffsetY: editSpot.content?.photoOffsetY ?? 0,
        drawingDataUrl: editSpot.content?.drawingData || null,
        drawingOpacity: editSpot.content?.drawingOpacity ?? 1,
        stickers: editSpot.content?.stickers || [],
        photoAdjustments: editSpot.content?.photoAdjustments || { ...DEFAULT_ADJUSTMENTS },
        layers: editSpot.content?.layers || [],
        isCurvedText: editSpot.content?.isCurvedText || false,
        curveRadius: editSpot.content?.curveRadius,
        textStroke: editSpot.content?.textStroke,
        textGlow: editSpot.content?.textGlow,
        letterSpacing: editSpot.content?.letterSpacing || 0,
        allowComments: editSpot.allowComments ?? true,
        visibility: editSpot.visibility || 'public',
        title: editSpot.title || editSpot.content?.title || '',
        description: editSpot.description || editSpot.content?.description || '',
        location: editSpot.location || editSpot.content?.location || '',
        tags: editSpot.tags || editSpot.content?.tags || [],
        taggedUsers: editSpot.taggedUsers || editSpot.content?.taggedUsers || [],
        connectedSpotIds: editSpot.connectedSpotIds || editSpot.content?.connectedSpotIds || [],
        audioDraft: editSpot.content?.audio
          ? {
              previewUrl: editSpot.content.audio.url,
              duration: editSpot.content.audio.duration,
              type: editSpot.content.audio.type,
              mimeType: editSpot.content.audio.mimeType,
              storageKey: editSpot.content.audio.storageKey,
            }
          : null,
      };

      if (editSpot.tier === 'big_pop') {
        setBigDraft(draft);
      } else {
        setMiniDraft(draft);
      }
    } else {
      setTier(initialTier);
    }
  }, [editSpot, initialTier, isOpen]);

  // Active Draft based on tier
  const currentDraft = tier === 'big_pop' ? bigDraft : miniDraft;

  // History tracking for Undo/Redo isolated by tier
  const [miniUndoHistory, setMiniUndoHistory] = useState<PlanDraft[]>([]);
  const [miniRedoHistory, setMiniRedoHistory] = useState<PlanDraft[]>([]);
  const [bigUndoHistory, setBigUndoHistory] = useState<PlanDraft[]>([]);
  const [bigRedoHistory, setBigRedoHistory] = useState<PlanDraft[]>([]);
  const lastHistorySnapshotRef = useRef<number>(0);
  const pendingHistoryDraftRef = useRef<PlanDraft | null>(null);

  const undoHistory = tier === 'big_pop' ? bigUndoHistory : miniUndoHistory;
  const redoHistory = tier === 'big_pop' ? bigRedoHistory : miniRedoHistory;

  const saveHistorySnapshot = (draftToSave: PlanDraft) => {
    if (tier === 'big_pop') {
      setBigUndoHistory((prev) => {
        if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(draftToSave)) {
          return prev;
        }
        return [...prev, draftToSave].slice(-30);
      });
      setBigRedoHistory([]);
    } else {
      setMiniUndoHistory((prev) => {
        if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(draftToSave)) {
          return prev;
        }
        return [...prev, draftToSave].slice(-30);
      });
      setMiniRedoHistory([]);
    }
  };

  const updateDraft = (updates: Partial<PlanDraft>, immediateHistory = false) => {
    // Record history snapshot before applying updates
    if (immediateHistory) {
      saveHistorySnapshot(currentDraft);
    } else {
      const now = Date.now();
      if (!pendingHistoryDraftRef.current) {
        pendingHistoryDraftRef.current = currentDraft;
      }
      if (now - lastHistorySnapshotRef.current > 400) {
        saveHistorySnapshot(pendingHistoryDraftRef.current || currentDraft);
        pendingHistoryDraftRef.current = null;
        lastHistorySnapshotRef.current = now;
      }
    }

    if (tier === 'big_pop') {
      setBigDraft((prev) => ({ ...prev, ...updates }));
    } else {
      setMiniDraft((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleUndo = () => {
    const history = tier === 'big_pop' ? bigUndoHistory : miniUndoHistory;
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    if (tier === 'big_pop') {
      setBigRedoHistory((prev) => [...prev, currentDraft].slice(-30));
      setBigUndoHistory((prev) => prev.slice(0, -1));
      setBigDraft(previous);
    } else {
      setMiniRedoHistory((prev) => [...prev, currentDraft].slice(-30));
      setMiniUndoHistory((prev) => prev.slice(0, -1));
      setMiniDraft(previous);
    }
    triggerMobileHaptic(10);
  };

  const handleRedo = () => {
    const history = tier === 'big_pop' ? bigRedoHistory : miniRedoHistory;
    if (history.length === 0) return;
    const next = history[history.length - 1];
    if (tier === 'big_pop') {
      setBigUndoHistory((prev) => [...prev, currentDraft].slice(-30));
      setBigRedoHistory((prev) => prev.slice(0, -1));
      setBigDraft(next);
    } else {
      setMiniUndoHistory((prev) => [...prev, currentDraft].slice(-30));
      setMiniRedoHistory((prev) => prev.slice(0, -1));
      setMiniDraft(next);
    }
    triggerMobileHaptic(10);
  };

  // Active Tool Tab in Editor
  const [activeEditorTab, setActiveEditorTab] = useState<
    'photo' | 'adjust' | 'retouch' | 'text' | 'stickers' | 'draw' | 'frames' | 'themes' | 'audio'
  >('photo');
  const [selectedBgCategory, setSelectedBgCategory] = useState<'all' | 'halloween' | 'christmas' | 'love' | 'retro' | 'classic'>('all');
  const [selectedFontCategory, setSelectedFontCategory] = useState<string>('All');

  // Sticker search
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');

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

  const handleCustomStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    setErrorMessage(null);

    try {
      const safety = await checkImageSafety(file);
      if (!safety.safe) {
        setErrorMessage(
          safety.reason ||
          'This sticker could not be uploaded because it appears to contain sensitive or adult content. Please choose another image.'
        );
        e.target.value = '';
        setIsScanningImage(false);
        return;
      }
    } catch (err) {
      console.warn('Sticker safety check error:', err);
    } finally {
      setIsScanningImage(false);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleAddImageLayer(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
    // If an item (e.g. photo, headline, sticker) was selected very recently (< 450ms),
    // ignore any accidental unselect or background clicks that immediately follow the pointer event!
    if ((id === null || id === 'background') && Date.now() - lastSelectedAtRef.current < 450) {
      return;
    }

    setSelectedItemId(id);
    if (!id) return;
    lastSelectedAtRef.current = Date.now();

    // Auto-focus the corresponding Picsart tool tab when user taps an element:
    if (id === 'photo') {
      setActiveEditorTab('photo');
      setIsDrawingMode(false);
    } else if (id === 'audio') {
      setActiveEditorTab('audio');
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

  // Tab Bar Horizontal Scroll helpers for Desktop / PC & Mobile
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabsScroll = () => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkTabsScroll();
    window.addEventListener('resize', checkTabsScroll);
    return () => window.removeEventListener('resize', checkTabsScroll);
  }, [tier]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkTabsScroll, 300);
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tabsContainerRef.current) return;
    if (e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
      checkTabsScroll();
    }
  };

  const isDraggingTabsRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);

  const handleTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingTabsRef.current = true;
    dragStartXRef.current = e.clientX;
    scrollStartLeftRef.current = tabsContainerRef.current?.scrollLeft || 0;
  };

  const handleTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingTabsRef.current || !tabsContainerRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    tabsContainerRef.current.scrollLeft = scrollStartLeftRef.current - dx;
    checkTabsScroll();
  };

  const handleTabsPointerUp = () => {
    isDraggingTabsRef.current = false;
  };

  // =================== NATIVE MOBILE CREATIVE STUDIO STATE ===================
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [mobileActiveSheet, setMobileActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerMobileHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  };

  const handleDuplicateSticker = (stk: StickerItem) => {
    triggerMobileHaptic(15);
    const newSticker: StickerItem = {
      ...stk,
      id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      x: Math.min(130, stk.x + 12),
      y: Math.min(160, stk.y + 12),
    };
    updateDraft({ stickers: [...currentDraft.stickers, newSticker] });
    setSelectedItemId(newSticker.id);
  };

  const handleSelectItemWithMobileSheet = (id: string | null) => {
    setSelectedItemId(id);
    if (!id) return;
    if (isMobile) {
      if (id === 'headline' || id === 'subtext') {
        setMobileActiveSheet('text');
        setActiveEditorTab('text');
      } else if (id === 'photo') {
        setMobileActiveSheet('adjust');
        setActiveEditorTab('adjust');
      } else if (id === 'background') {
        setMobileActiveSheet('themes');
        setActiveEditorTab('themes');
      }
    }
  };

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

  // Restore existing drawing onto HD canvas when drawing mode is entered
  useEffect(() => {
    if (isDrawingMode && currentDraft.drawingDataUrl && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentDraft.drawingDataUrl;
      }
    }
  }, [isDrawingMode, currentDraft.drawingDataUrl]);

  // Auto-scroll tab bar so active section is always visible
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const container = tabsContainerRef.current;
    const activeBtn = container.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const currentScroll = container.scrollLeft;
      const targetScroll = currentScroll + (btnRect.left - containerRect.left) - (containerRect.width / 2) + (btnRect.width / 2);
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    setTimeout(checkTabsScroll, 300);
  }, [activeEditorTab, isDrawingMode]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

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
    const scaleRatio = canvas.width / 170; // HD supersampling multiplier

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5 * scaleRatio;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = brushOpacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawTool === 'neon') {
        ctx.strokeStyle = drawColor;
        ctx.shadowColor = drawColor;
        ctx.shadowBlur = 14 * scaleRatio;
        ctx.lineWidth = brushSize * scaleRatio;
      } else if (drawTool === 'calligraphy') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.lineWidth = brushSize * 1.5 * scaleRatio;
      } else if (drawTool === 'watercolor') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 4 * scaleRatio;
        ctx.globalAlpha = brushOpacity * 0.4;
        ctx.lineWidth = brushSize * 2 * scaleRatio;
      } else if (drawTool === 'highlighter') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = brushOpacity * 0.45;
        ctx.lineWidth = brushSize * 2.5 * scaleRatio;
      } else if (drawTool === 'pencil') {
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = brushOpacity * 0.75;
        ctx.lineWidth = Math.max(1 * scaleRatio, brushSize * 0.8 * scaleRatio);
      } else if (drawTool === 'rainbow') {
        const nextHue = (rainbowHue + 15) % 360;
        setRainbowHue(nextHue);
        ctx.strokeStyle = `hsl(${nextHue}, 100%, 55%)`;
        ctx.shadowColor = `hsl(${nextHue}, 100%, 65%)`;
        ctx.shadowBlur = 10 * scaleRatio;
        ctx.lineWidth = brushSize * scaleRatio;
      } else {
        // pen or spray
        ctx.strokeStyle = drawColor;
        ctx.shadowBlur = 0;
        ctx.lineWidth = brushSize * scaleRatio;
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
    const scaleRatio = canvas.width / 170;

    if (drawTool === 'graffiti') {
      // Stochastic spray airbrush effect with HD density
      ctx.fillStyle = drawColor;
      ctx.globalAlpha = brushOpacity * 0.35;
      const density = brushSize * 4 * scaleRatio;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * brushSize * 1.5 * scaleRatio;
        const sprayX = x + Math.cos(angle) * radius;
        const sprayY = y + Math.sin(angle) * radius;
        ctx.fillRect(sprayX, sprayY, 1.5 * scaleRatio, 1.5 * scaleRatio);
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
        ctx.arc(x + (Math.random() * 10 - 5) * scaleRatio, y + (Math.random() * 10 - 5) * scaleRatio, 1.5 * scaleRatio, 0, Math.PI * 2);
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

  // Image File Upload for Big Pop with Automatic Phone Photo / HEIC Normalization & Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept all standard images, camera photos, HEIC/HEIF phone formats
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif|avif|bmp|tiff)$/i.test(file.name);

    if (!isImage) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, GIF, or Phone Photo)');
      e.target.value = '';
      return;
    }

    setErrorMessage(null);
    setIsScanningImage(true);

    try {
      // 1. Normalize, downscale 48MP+ camera photos, and convert HEIC to clean JPEG
      const optimized = await prepareImageForUpload(file);

      // 2. Perform safety check on the clean normalized image
      try {
        const safety = await checkImageSafety(optimized.dataUrl);
        if (!safety.safe) {
          setErrorMessage(
            safety.reason ||
            'This image could not be uploaded because it appears to contain sensitive or adult content. Please choose another photo or artwork!'
          );
          e.target.value = '';
          setIsScanningImage(false);
          return;
        }
      } catch (err) {
        console.warn('Safety classification notice:', err);
      } finally {
        setIsScanningImage(false);
      }

      // 3. Instant visual preview for user with normalized clean image
      updateDraft({
        imageUrl: optimized.dataUrl,
        photoZoom: 1,
        photoOffsetX: 0,
        photoOffsetY: 0,
      });

      // 4. Background server-side compression & object storage
      try {
        const res = await api.uploadImage(optimized.dataUrl, optimized.filename);
        if (res?.imageUrl) {
          updateDraft({ imageUrl: res.imageUrl });
        }
      } catch (err: any) {
        console.warn('Background image upload notice:', err);
        setErrorMessage(err.message || 'Image upload failed. Please try another photo.');
        updateDraft({ imageUrl: DEFAULT_SPOT_PHOTO });
      }
    } catch (err: any) {
      console.error('File optimization error:', err);
      setErrorMessage('Could not process this image file. Please try another photo.');
      setIsScanningImage(false);
    }

    e.target.value = '';
  };

  // Proceed to checkout and publish
  const handleProceedToPayment = async () => {
    // Both Headline and Creator Signature are completely optional!
    // Verify the spot has at least one piece of content (photo, drawing, text, sticker, audio)
    const hasPhoto = Boolean(currentDraft.imageUrl);
    const hasDrawing = Boolean(currentDraft.drawingDataUrl);
    const hasStickers = Boolean(currentDraft.stickers && currentDraft.stickers.length > 0);
    const hasLayers = Boolean(currentDraft.layers && currentDraft.layers.length > 0);
    const hasHeadline = Boolean(currentDraft.headline && currentDraft.headline.trim());
    const hasSubtext = Boolean(currentDraft.secondaryText && currentDraft.secondaryText.trim());
    const hasAudio = Boolean(currentDraft.audioDraft || editSpot?.content?.audio);

    if (!hasPhoto && !hasDrawing && !hasStickers && !hasLayers && !hasHeadline && !hasSubtext && !hasAudio) {
      setErrorMessage('Please add some content (a photo, message, drawing, sticker, or voice note) to your spot!');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setStep('processing');

    try {
      const resolvedCreator = currentDraft.creatorName?.trim() || 'Spotter';
      const resolvedHeadline = currentDraft.headline ? currentDraft.headline.trim() : '';
      const isPioneerAuthor = editSpot?.content?.author?.toLowerCase().includes('spot pioneer');
      const resolvedAuthor = editSpot?.content?.author && !isPioneerAuthor ? editSpot.content.author : '';
      // Ensure image is converted to optimized object storage asset before submitting
      let finalImageUrl = currentDraft.imageUrl;
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        try {
          const isGif = finalImageUrl.startsWith('data:image/gif');
          const uploadRes = await api.uploadImage(finalImageUrl, isGif ? 'artwork.gif' : 'photo.jpg');
          if (uploadRes?.imageUrl) {
            finalImageUrl = uploadRes.imageUrl;
          }
        } catch (e) {
          console.warn('Image optimization fallback:', e);
        }
      }

      // Convert and upload audio object only after user confirms and saves (Big Pop only)
      let finalAudio: SpotAudio | undefined = editSpot?.content?.audio || undefined;
      const audioBlob = currentDraft.audioDraft?.blob;
      if (tier === 'big_pop' && currentDraft.audioDraft && audioBlob) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          const audioBase64 = await base64Promise;

          const uploadRes = await api.uploadAudio({
            audioBase64,
            duration: currentDraft.audioDraft.duration,
            mimeType: currentDraft.audioDraft.mimeType,
            type: currentDraft.audioDraft.type,
          });

          if (uploadRes?.audio) {
            finalAudio = uploadRes.audio;
          }
        } catch (err: any) {
          console.warn('Audio upload error:', err);
          throw new Error(err.message || 'Audio upload failed. Ensure recording is within 15s and 500 KB.');
        }
      }

      const draftSpot: Partial<Spot> = {
        shape: currentDraft.shape,
        background: currentDraft.backgroundColor,
        creatorName: resolvedCreator,
        allowComments: currentDraft.allowComments ?? true,
        visibility: currentDraft.visibility || 'public',
        title: currentDraft.title?.trim() || resolvedHeadline || undefined,
        description: currentDraft.description?.trim() || undefined,
        location: currentDraft.location?.trim() || undefined,
        tags: currentDraft.tags || [],
        taggedUsers: currentDraft.taggedUsers || [],
        connectedSpotIds: currentDraft.connectedSpotIds || [],
        content: {
          title: currentDraft.title?.trim() || resolvedHeadline || undefined,
          description: currentDraft.description?.trim() || undefined,
          location: currentDraft.location?.trim() || undefined,
          tags: currentDraft.tags || [],
          taggedUsers: currentDraft.taggedUsers || [],
          connectedSpotIds: currentDraft.connectedSpotIds || [],
          headline: resolvedHeadline,
          headlineX: currentDraft.headlineX,
          headlineY: currentDraft.headlineY,
          text: currentDraft.secondaryText ? currentDraft.secondaryText.trim() : '',
          subtextX: currentDraft.subtextX,
          subtextY: currentDraft.subtextY,
          subtextSize: currentDraft.subtextSize,
          subtextFontFamily: currentDraft.subtextFontFamily,
          subtextColor: currentDraft.subtextColor,
          subtextOpacity: currentDraft.subtextOpacity,
          subtextStroke: currentDraft.subtextStroke,
          subtextGlow: currentDraft.subtextGlow,
          subtext3D: currentDraft.subtext3D,
          subtextGradient: currentDraft.subtextGradient,
          subtextLetterSpacing: currentDraft.subtextLetterSpacing,
          author: resolvedAuthor,
          authorX: currentDraft.authorX,
          authorY: currentDraft.authorY,
          authorSize: currentDraft.authorSize,
          authorOpacity: currentDraft.authorOpacity,
          authorFontFamily: currentDraft.authorFontFamily,
          authorColor: currentDraft.authorColor,
          authorStroke: currentDraft.authorStroke,
          authorGlow: currentDraft.authorGlow,
          author3D: currentDraft.author3D,
          textColor: currentDraft.textColor,
          fontFamily: currentDraft.fontFamily,
          fontSize: currentDraft.fontSize,
          textOpacity: currentDraft.textOpacity,
          alignment: currentDraft.alignment,
          imageUrl: finalImageUrl,
          imageFit: currentDraft.imageFit || 'cover',
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
          tags: currentDraft.tags,
          audio: finalAudio,
        },
      };

      if (editSpot) {
        // EDIT MODE: Update existing spot directly without payment
        const updateRes = await api.updateSpot(
          editSpot.id,
          {
            shape: currentDraft.shape,
            background: currentDraft.backgroundColor,
            creatorName: resolvedCreator,
            allowComments: currentDraft.allowComments ?? true,
            visibility: currentDraft.visibility || 'public',
            title: currentDraft.title?.trim() || resolvedHeadline || undefined,
            description: currentDraft.description?.trim() || undefined,
            location: currentDraft.location?.trim() || undefined,
            tags: currentDraft.tags || [],
            taggedUsers: currentDraft.taggedUsers || [],
            connectedSpotIds: currentDraft.connectedSpotIds || [],
            content: draftSpot.content,
          },
          authToken || undefined
        );

        if (updateRes.success && updateRes.spot) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF2E93', '#FFE600', '#00F0FF', '#7928CA'],
          });
          onSuccess(updateRes.spot);
          onClose();
          return;
        } else {
          throw new Error('Failed to update spot. Please try again.');
        }
      }

      // CREATE MODE: Process order and payment verification
      const orderRes = await api.createOrder({
        productId: tier,
        spotDraft: draftSpot,
        creatorName: resolvedCreator,
        token: authToken || undefined,
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

  const MOBILE_TOOLS: { id: string; label: string; icon: string; bigPopOnly?: boolean }[] = [
    ...(tier === 'big_pop'
      ? [{ id: 'photo', label: 'Tools', icon: '📐', bigPopOnly: true }]
      : []),
    ...(tier === 'big_pop'
      ? [{ id: 'adjust', label: 'Adjust', icon: '🎨', bigPopOnly: true }]
      : []),
    ...(tier === 'big_pop'
      ? [{ id: 'retouch', label: 'Retouch', icon: '✨', bigPopOnly: true }]
      : []),
    { id: 'text', label: 'Text', icon: '✍️' },
    { id: 'stickers', label: 'Stickers', icon: '💖' },
    ...(tier === 'big_pop'
      ? [{ id: 'draw', label: 'Draw', icon: '🖌️', bigPopOnly: true }]
      : []),
    { id: 'frames', label: 'Frames', icon: '🖼️' },
    { id: 'themes', label: 'Background', icon: '🌈' },
    ...(tier === 'big_pop'
      ? [{ id: 'audio', label: 'Audio', icon: '🎙️', bigPopOnly: true }]
      : []),
    { id: 'audience', label: 'Details', icon: '📝' },
  ];

  const handleMobileToolSelect = (toolId: string) => {
    triggerMobileHaptic(12);
    if (toolId === 'draw') {
      setIsDrawingMode(true);
      setActiveEditorTab('draw');
    } else {
      setIsDrawingMode(false);
      setActiveEditorTab(toolId as any);
      if (toolId === 'adjust' || toolId === 'photo' || toolId === 'retouch') {
        setSelectedItemId('photo');
      } else if (toolId === 'themes') {
        setSelectedItemId('background');
      }
    }
    setMobileActiveSheet((prev) => (prev === toolId ? null : toolId));
  };

  const renderTabContent = (tabKey: string) => {
    switch (tabKey) {
      case 'photo':
        return tier === 'big_pop' && !isDrawingMode ? (
          <PhotoCropTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            updatePhotoAdjustments={updatePhotoAdjustments}
            tier={tier}
            onFileUpload={handleFileUpload}
          />
        ) : null;
      case 'adjust':
        return !isDrawingMode ? (
          <AdjustTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            updatePhotoAdjustments={updatePhotoAdjustments}
          />
        ) : null;
      case 'retouch':
        return tier === 'big_pop' && !isDrawingMode ? (
          <RetouchTab
            currentDraft={currentDraft}
            updatePhotoAdjustments={updatePhotoAdjustments}
          />
        ) : null;
      case 'text':
        return !isDrawingMode ? (
          <TextStudioTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            selectedFontCategory={selectedFontCategory}
            setSelectedFontCategory={setSelectedFontCategory}
            selectedItemId={selectedItemId}
            onSelectTarget={(target) => setSelectedItemId(target)}
          />
        ) : null;
      case 'stickers':
        return !isDrawingMode ? (
          <StickersStockTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            handleAddSticker={handleAddSticker}
            onCustomStickerUpload={handleCustomStickerUpload}
            selectedItemId={selectedItemId}
            onUpdateSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
          />
        ) : null;
      case 'draw':
        return (isDrawingMode || activeEditorTab === 'draw') ? (
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
        ) : null;
      case 'frames':
        return !isDrawingMode ? (
          <FramesTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            tier={tier}
            handleSelectShape={handleSelectShape}
          />
        ) : null;
      case 'themes':
        return !isDrawingMode ? (
          <ThemesTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
            selectedBgCategory={selectedBgCategory}
            setSelectedBgCategory={setSelectedBgCategory}
          />
        ) : null;
      case 'audio':
        return tier === 'big_pop' && !isDrawingMode ? (
          <AudioStudioTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
          />
        ) : null;
      case 'audience':
        return !isDrawingMode ? (
          <AudienceTab
            currentDraft={currentDraft}
            updateDraft={updateDraft}
          />
        ) : null;
      default:
        return null;
    }
  };

  const renderSpotCardElement = () => (
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
        subtextFontFamily: currentDraft.subtextFontFamily,
        subtextColor: currentDraft.subtextColor,
        subtextOpacity: currentDraft.subtextOpacity,
        subtextStroke: currentDraft.subtextStroke,
        subtextGlow: currentDraft.subtextGlow,
        subtext3D: currentDraft.subtext3D,
        subtextGradient: currentDraft.subtextGradient,
        subtextLetterSpacing: currentDraft.subtextLetterSpacing,
        author: currentDraft.creatorName,
        authorX: currentDraft.authorX,
        authorY: currentDraft.authorY,
        authorSize: currentDraft.authorSize,
        authorOpacity: currentDraft.authorOpacity,
        authorFontFamily: currentDraft.authorFontFamily,
        authorColor: currentDraft.authorColor,
        authorStroke: currentDraft.authorStroke,
        authorGlow: currentDraft.authorGlow,
        author3D: currentDraft.author3D,
        textColor: currentDraft.textColor,
        fontFamily: currentDraft.fontFamily,
        fontSize: currentDraft.fontSize,
        textOpacity: currentDraft.textOpacity,
        alignment: currentDraft.alignment,
        imageUrl: tier === 'big_pop' ? currentDraft.imageUrl : undefined,
        imageFit: currentDraft.imageFit,
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
        text3D: currentDraft.text3D,
        textGradient: currentDraft.textGradient,
        letterSpacing: currentDraft.letterSpacing,
        audio: currentDraft.audioDraft
          ? {
              url: currentDraft.audioDraft.previewUrl,
              duration: currentDraft.audioDraft.duration,
              type: currentDraft.audioDraft.type,
              mimeType: currentDraft.audioDraft.mimeType,
              size: currentDraft.audioDraft.size || 0,
              storageKey: (currentDraft.audioDraft as any).storageKey || '',
            }
          : editSpot?.content?.audio,
      }}
      creatorName={currentDraft.creatorName}
      interactive={!isDrawingMode}
      selectedItemId={selectedItemId}
      onSelectItem={handleSelectItemWithMobileSheet}
      onUpdateSticker={handleUpdateSticker}
      onDeleteSticker={handleDeleteSticker}
      onDuplicateSticker={handleDuplicateSticker}
      onUpdateLayer={handleUpdateLayer}
      onDeleteLayer={handleDeleteLayer}
      onUpdateContent={(updates) => {
        const draftUpdates: Partial<PlanDraft> = { ...updates };
        if (updates.author !== undefined) {
          draftUpdates.creatorName = updates.author;
        }
        if (updates.text !== undefined) {
          draftUpdates.secondaryText = updates.text;
        }
        updateDraft(draftUpdates);
      }}
      drawingCanvasOverlay={
        isDrawingMode ? (
          <canvas
            ref={drawingCanvasRef}
            width={680}
            height={tier === 'big_pop' ? 840 : 680}
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
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full h-full lg:max-w-4xl lg:h-[90vh] flex flex-col bg-[#12141F] lg:border lg:border-white/15 lg:rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Top Header */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/70 z-30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-base shrink-0 active:scale-95"
              title="Close"
            >
              ✕
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <SpotPopLogo variant="icon" size={22} />
              <h3 className="font-outfit font-bold text-sm text-white truncate hidden xs:inline">
                {editSpot ? 'Edit Pop' : 'Studio'}
              </h3>
            </div>

            {/* Plan Switcher Pills */}
            {!editSpot ? (
              <div className="flex items-center p-0.5 bg-black/80 rounded-lg border border-white/10 ml-1">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('mini_pop')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    tier === 'mini_pop'
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mini ₹29
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPlan('big_pop')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    tier === 'big_pop'
                      ? 'bg-[#FF2E93] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Big ₹99
                </button>
              </div>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FF2E93]/20 text-[#FF5EAA] border border-[#FF2E93]/30 truncate">
                Editing {tier === 'big_pop' ? 'Big' : 'Mini'}
              </span>
            )}
          </div>

          {/* Right Header Controls: Undo, Redo, and Publish CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoHistory.length === 0}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all active:scale-90 border border-white/10 disabled:border-transparent"
              title={undoHistory.length > 0 ? `Undo (${undoHistory.length})` : 'Undo'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoHistory.length === 0}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all active:scale-90 border border-white/10 disabled:border-transparent"
              title={redoHistory.length > 0 ? `Redo (${redoHistory.length})` : 'Redo'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>

            {/* Top Right Action Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleProceedToPayment}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 ${
                editSpot
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : tier === 'big_pop'
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white shadow-pink-500/25'
                  : 'bg-amber-400 text-black'
              }`}
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{editSpot ? 'Save' : `Claim (${tier === 'big_pop' ? '₹99' : '₹29'}) →`}</span>
              )}
            </button>
          </div>
        </div>

        {/* ================= STUDIO WORKSPACE ================= */}
        {isMobile ? (
          /* ================= DEDICATED NATIVE MOBILE STUDIO ================= */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[#07080D]">
            {/* Live WYSIWYG Canvas Stage (Adapts height flexibly so the card is never clipped) */}
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleSelectItemWithMobileSheet(null);
                }
              }}
              className={`w-full flex-1 min-h-0 flex flex-col items-center justify-center relative select-none overflow-hidden transition-all duration-300 ${
                mobileActiveSheet !== null ? 'p-2 border-b border-white/10' : 'p-4'
              }`}
            >
              {/* Card centered and scaled for mobile viewport to ensure prominent, crystal-clear readability */}
              <div
                className={`relative transition-transform duration-300 origin-center my-auto ${
                  mobileActiveSheet !== null ? 'scale-[1.18] xs:scale-[1.28] sm:scale-[1.38]' : 'scale-[1.55] xs:scale-[1.68] sm:scale-[1.80]'
                }`}
              >
                {renderSpotCardElement()}
              </div>

              {/* Floating Quick Action Selection Bar (Shown only when sheet is closed so bars never stack or cover card) */}
              {selectedItemId && mobileActiveSheet === null && (
                <div className="absolute bottom-2 inset-x-2 px-3 py-1.5 rounded-xl bg-[#181B2A]/95 backdrop-blur-md border border-[#FF2E93]/40 flex items-center justify-between shadow-xl z-30 animate-fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-white truncate">
                      {activeSelectedSticker
                        ? `Sticker (${activeSelectedSticker.emojiOrIcon})`
                        : selectedItemId === 'headline'
                        ? 'Headline'
                        : selectedItemId === 'subtext'
                        ? 'Subtext'
                        : selectedItemId === 'author'
                        ? 'Creator Tag'
                        : selectedItemId === 'photo'
                        ? 'Photo Artwork'
                        : selectedItemId === 'background'
                        ? 'Background'
                        : 'Selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeSelectedSticker && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSticker(activeSelectedSticker.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectItemWithMobileSheet(null)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error and Scanning Banners on Mobile */}
            {errorMessage && (
              <div className="shrink-0 mx-2 my-1.5 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg z-30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">🛡️</span>
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {isScanningImage && (
              <div className="shrink-0 mx-2 my-1.5 p-2 rounded-xl bg-[#FF2E93]/20 border border-[#FF2E93]/40 text-white text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse z-30">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin shrink-0" />
                <span className="font-semibold text-[11px]">🛡️ Scanning image safety...</span>
              </div>
            )}

            {/* Contextual Mobile Bottom Sheet (Compact drawer leaving 65% screen for canvas) */}
            {mobileActiveSheet !== null && (
              <div className="shrink-0 flex flex-col bg-[#11131E] border-t border-white/20 rounded-t-3xl shadow-2xl z-40 max-h-[35vh] sm:max-h-[38vh] relative animate-slide-up">
                {/* Grab handle & sheet header */}
                <div className="shrink-0 px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-between relative">
                  <div className="w-10 h-1 rounded-full bg-white/30 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {MOBILE_TOOLS.find((t) => t.id === mobileActiveSheet)?.icon}{' '}
                    {MOBILE_TOOLS.find((t) => t.id === mobileActiveSheet)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerMobileHaptic(10);
                      setMobileActiveSheet(null);
                      if (isDrawingMode) setIsDrawingMode(false);
                    }}
                    className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>✓ Done</span>
                  </button>
                </div>

                {/* Sheet Scrollable Content with generous bottom padding so NO content is ever cut off in any tab */}
                <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-3 pb-24 space-y-3 min-h-0">
                  {renderTabContent(mobileActiveSheet)}
                </div>
              </div>
            )}

            {/* Placement Fee Quick Info Bar when sheet is closed */}
            {mobileActiveSheet === null && (
              <div className="shrink-0 px-4 py-1.5 bg-[#080910] border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Placement Fee:{' '}
                  <strong className="text-white font-bold">{editSpot ? 'Free' : tier === 'big_pop' ? '₹99' : '₹29'}</strong>
                </span>
                <span className="text-[10px] text-slate-500">Tap any tool below or tap item to edit</span>
              </div>
            )}

            {/* Native Horizontal Scrollable 9-Tool Bottom Bar */}
            <div className="shrink-0 bg-[#0A0C14] border-t border-white/10 px-2 pt-2 pb-[max(env(safe-area-inset-bottom,0px),16px)] flex items-center z-30">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full py-0.5">
                {MOBILE_TOOLS.map((tool) => {
                  if (tool.bigPopOnly && tier !== 'big_pop') return null;
                  const isActive = mobileActiveSheet === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleMobileToolSelect(tool.id)}
                      className={`min-w-[62px] h-[52px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all shrink-0 cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-[#FF2E93] text-white shadow-lg shadow-pink-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-lg leading-none shrink-0">{tool.icon}</span>
                      <span className="text-[10px] font-bold tracking-tight leading-tight shrink-0 mt-0.5">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= DESKTOP SPLIT-VIEW STUDIO ================= */
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden min-h-0">
            {/* Desktop Preview */}
            <div className="lg:col-span-5 shrink-0 flex flex-col items-center justify-center bg-[#07080D] border-r border-white/10 relative overflow-hidden select-none p-4 h-full">
              <div className="absolute top-2 right-3 flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoHistory.length === 0}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Undo"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                  </svg>
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoHistory.length === 0}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Redo"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                  </svg>
                  <span>Redo</span>
                </button>
              </div>

              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    handleSelectItem(null);
                  }
                }}
                className="w-full h-full flex flex-col items-center justify-center relative scale-115 lg:scale-125 origin-center transition-transform"
              >
                <div className="relative">
                  {renderSpotCardElement()}
                </div>
              </div>

              {selectedItemId && (
                <div className="absolute bottom-2 inset-x-4 px-3 py-1.5 rounded-xl bg-[#181B2A]/90 backdrop-blur-md border border-[#FF2E93]/40 flex items-center justify-between shadow-lg z-20">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-white truncate">
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
                  <div className="flex items-center gap-1.5 shrink-0">
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
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Right Accordion Tabs */}
            <div className="lg:col-span-7 flex-1 flex flex-col min-h-0 overflow-hidden bg-[#12141F]">
              <div className="relative flex items-center p-2 border-b border-white/10 bg-[#0E101A] shrink-0">
                {canScrollLeft && (
                  <button
                    type="button"
                    onClick={() => handleScrollTabs('left')}
                    className="absolute left-1 z-20 w-6 h-6 rounded-full bg-slate-900/95 hover:bg-black text-white border border-white/25 flex items-center justify-center text-xs font-extrabold shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95"
                    title="Previous Sections"
                  >
                    ‹
                  </button>
                )}

                <div
                  ref={tabsContainerRef}
                  onScroll={checkTabsScroll}
                  onWheel={handleTabsWheel}
                  onPointerDown={handleTabsPointerDown}
                  onPointerMove={handleTabsPointerMove}
                  onPointerUp={handleTabsPointerUp}
                  className="flex items-center gap-1.5 overflow-x-auto scroll-smooth no-scrollbar w-full select-none cursor-grab active:cursor-grabbing px-1"
                >
                  {tier === 'big_pop' && (
                    <button
                      type="button"
                      data-active={activeEditorTab === 'photo' && !isDrawingMode}
                      onClick={() => {
                        setActiveEditorTab('photo');
                        setIsDrawingMode(false);
                        setSelectedItemId('photo');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        activeEditorTab === 'photo' && !isDrawingMode
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>📐</span>
                      <span>Tools</span>
                    </button>
                  )}

                  {tier === 'big_pop' && (
                    <button
                      type="button"
                      data-active={activeEditorTab === 'adjust' && !isDrawingMode}
                      onClick={() => {
                        setActiveEditorTab('adjust');
                        setIsDrawingMode(false);
                        setSelectedItemId('photo');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        activeEditorTab === 'adjust' && !isDrawingMode
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🎨</span>
                      <span>Adjust</span>
                    </button>
                  )}

                  {tier === 'big_pop' && (
                    <button
                      type="button"
                      data-active={activeEditorTab === 'retouch' && !isDrawingMode}
                      onClick={() => {
                        setActiveEditorTab('retouch');
                        setIsDrawingMode(false);
                        setSelectedItemId('photo');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
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
                    data-active={activeEditorTab === 'text' && !isDrawingMode}
                    onClick={() => {
                      setActiveEditorTab('text');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
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
                    data-active={activeEditorTab === 'stickers' && !isDrawingMode}
                    onClick={() => {
                      setActiveEditorTab('stickers');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                      activeEditorTab === 'stickers' && !isDrawingMode
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>💖</span>
                    <span>Stickers</span>
                  </button>

                  {tier === 'big_pop' && (
                    <button
                      type="button"
                      data-active={isDrawingMode || activeEditorTab === 'draw'}
                      onClick={() => {
                        setActiveEditorTab('draw');
                        setIsDrawingMode(true);
                        setSelectedItemId(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        isDrawingMode
                          ? 'bg-gradient-to-r from-[#FF2E93] to-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🖌️</span>
                      <span>Draw</span>
                    </button>
                  )}

                  <button
                    type="button"
                    data-active={activeEditorTab === 'frames' && !isDrawingMode}
                    onClick={() => {
                      setActiveEditorTab('frames');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
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
                    data-active={activeEditorTab === 'themes' && !isDrawingMode}
                    onClick={() => {
                      setActiveEditorTab('themes');
                      setIsDrawingMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                      activeEditorTab === 'themes' && !isDrawingMode
                        ? 'bg-white text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🌈</span>
                    <span>Background</span>
                  </button>

                  {tier === 'big_pop' && (
                    <button
                      type="button"
                      data-active={activeEditorTab === 'audio' && !isDrawingMode}
                      onClick={() => {
                        setActiveEditorTab('audio');
                        setIsDrawingMode(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        activeEditorTab === 'audio' && !isDrawingMode
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🎙️</span>
                      <span>Audio</span>
                      {currentDraft.audioDraft && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  )}
                </div>

                {canScrollRight && (
                  <button
                    type="button"
                    onClick={() => handleScrollTabs('right')}
                    className="absolute right-1 z-20 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-[#FF2E93] text-white flex items-center justify-center text-xs font-extrabold shadow-lg transition-all cursor-pointer hover:scale-110 active:scale-95"
                    title="More Sections"
                  >
                    ›
                  </button>
                )}
              </div>

              {/* Desktop Active Tab Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0">🛡️</span>
                      <span className="leading-relaxed font-medium">{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {isScanningImage && (
                  <div className="p-3 rounded-2xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 text-white text-xs flex items-center justify-center gap-2.5 shadow-lg animate-pulse">
                    <span className="w-4 h-4 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin shrink-0" />
                    <span className="font-semibold">🛡️ Scanning image safety with MobileNetV2 locally in browser...</span>
                  </div>
                )}

                {renderTabContent(activeEditorTab)}
              </div>
            </div>
          </div>
        )}

        {/* PINNED ACTION FOOTER (Desktop only) */}
        {!isMobile && (
          <div className="shrink-0 px-4 py-3 bg-[#0a0c14] border-t border-white/10 flex items-center justify-between gap-3 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {editSpot ? 'Save Changes' : 'Placement Fee'}
                </span>
                <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                  {editSpot ? 'Free' : tier === 'big_pop' ? '₹99' : '₹29'}
                  <span className="text-[11px] font-normal text-slate-400 ml-1">one-time</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveEditorTab('audience');
                  setMobileActiveSheet('audience');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeEditorTab === 'audience'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Change audience & privacy"
              >
                <span>{currentDraft.visibility === 'private' ? '🔒 Private' : currentDraft.visibility === 'friends_only' ? '👥 Friends' : '🌍 Public'}</span>
                <span className="text-[10px] text-slate-400">⌵</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProceedToPayment}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  editSpot
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shadow-emerald-500/25'
                    : tier === 'big_pop'
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white hover:opacity-90 shadow-pink-500/25'
                    : 'bg-amber-400 text-black hover:bg-amber-300'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{editSpot ? 'Saving...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{editSpot ? '💾 Save Changes' : `Claim & Place (${tier === 'big_pop' ? '₹99' : '₹29'}) →`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
