import {
  SpotShape,
  FrameStyle,
  BlendMode,
  PhotoAdjustments,
} from '../../../types';
import { BrushStyle } from './types';

// =================== FONTS ===================
export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'Handwritten' | 'Modern' | 'Display' | 'Retro' | 'Serif';
}

export const ALL_FONTS: FontOption[] = [
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

// Universal Resilient Fallback SVG Image (Production-ready, offline, zero-network-dependency)
export const DEFAULT_SPOT_FALLBACK_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1e2f"/><stop offset="50%" stop-color="%232d1b4e"/><stop offset="100%" stop-color="%230f0c29"/></linearGradient><linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FF2E93"/><stop offset="100%" stop-color="%23FF8A00"/></linearGradient></defs><rect width="600" height="600" fill="url(%23g)"/><circle cx="300" cy="270" r="70" fill="url(%23neon)" opacity="0.18"/><rect x="235" y="225" width="130" height="96" rx="14" fill="none" stroke="url(%23neon)" stroke-width="5"/><circle cx="300" cy="273" r="26" fill="none" stroke="%23FFFFFF" stroke-width="4"/><circle cx="338" cy="245" r="6" fill="%2300F2FE"/><text x="300" y="380" fill="%23FFFFFF" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="22" font-weight="700" text-anchor="middle" letter-spacing="3">SPOTPOP</text><text x="300" y="410" fill="%2394A3B8" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" text-anchor="middle">Photo Artwork</text></svg>';


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
};
