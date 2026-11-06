import { PhotoAdjustments } from '../types';

export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  css: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Normal', icon: '✨', description: 'Original colors', css: '' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Moody teal & orange tone', css: 'contrast(1.18) saturate(1.22) sepia(0.12)' },
  { id: 'vintage', name: 'Vintage 70s', icon: '📼', description: 'Warm nostalgic sepia tone', css: 'sepia(0.42) contrast(0.92) brightness(1.05)' },
  { id: 'retro', name: 'Retro VHS', icon: '📺', description: '80s analog vibrant hue', css: 'saturate(1.45) contrast(1.12) hue-rotate(-12deg)' },
  { id: 'noir', name: 'Film Noir', icon: '🎞️', description: 'Deep contrast black & white', css: 'grayscale(1) contrast(1.35) brightness(0.92)' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', description: 'Neon magenta & cyan glow', css: 'hue-rotate(180deg) saturate(1.85) contrast(1.25)' },
  { id: 'pastel', name: 'Pastel Dream', icon: '🌸', description: 'Soft dreamy low contrast', css: 'brightness(1.12) saturate(0.85) contrast(0.92)' },
  { id: 'glitch', name: 'Glitch Art', icon: '👾', description: 'Chromatic electric fringe', css: 'invert(0.08) saturate(2.1) hue-rotate(90deg)' },
  { id: 'sketch', name: 'Artistic Sketch', icon: '✏️', description: 'Monochrome charcoal style', css: 'grayscale(1) contrast(3.2) brightness(1.1)' },
  { id: 'warm', name: 'Golden Hour', icon: '☀️', description: 'Warm sunlit radiant glow', css: 'sepia(0.24) saturate(1.35) brightness(1.08)' },
  { id: 'magic', name: 'Magic Ethereal', icon: '🪄', description: 'Fantasy luminous soft glow', css: 'brightness(1.18) saturate(1.3) contrast(1.08)' },
  { id: 'duotone', name: 'Pop Duotone', icon: '🎨', description: 'Punchy vivid two-tone', css: 'contrast(1.6) saturate(1.9) hue-rotate(45deg)' },
  { id: 'chrome', name: 'Chrome Future', icon: '🪞', description: 'Metallic reflective sheen', css: 'contrast(1.5) saturate(0.3) brightness(1.15)' },
  { id: 'emerald', name: 'Emerald Mood', icon: '🌲', description: 'Lush dark botanical green', css: 'hue-rotate(60deg) saturate(1.4) contrast(1.15)' },
  { id: 'sunset', name: 'Sunset Dream', icon: '🌅', description: 'Coral pink & deep violet', css: 'sepia(0.3) hue-rotate(-25deg) saturate(1.6)' },
  { id: 'neon', name: 'Neon Nightlife', icon: '🎆', description: 'Electric nightlife neon', css: 'saturate(2.2) contrast(1.3) brightness(0.95)' },
];

export const EFFECT_PRESETS = [
  { id: 'none', name: 'No Effect', icon: '⚪' },
  { id: 'glitch', name: 'Glitch Fringe', icon: '👾' },
  { id: 'sketch', name: 'Pencil Sketch', icon: '✏️' },
  { id: 'magic', name: 'Fairy Dust', icon: '✨' },
  { id: 'halftone', name: 'Pop Halftone', icon: '📰' },
  { id: 'pixelate', name: '8-Bit Pixel', icon: '🎮' },
  { id: 'artistic', name: 'Oil Painting', icon: '🖌️' },
  { id: 'duotone', name: 'Electric Duo', icon: '🎭' },
];

export const CURVE_PRESETS = [
  { id: 'linear', name: 'Linear (Default)', icon: '📈' },
  { id: 'punch', name: 'Punchy Contrast', icon: '💥' },
  { id: 'matte', name: 'Matte Vintage', icon: '☕' },
  { id: 'cross', name: 'Cross Process', icon: '🧪' },
  { id: 'deep_black', name: 'Deep Blacks', icon: '🖤' },
];

export function getPhotoFilterStyle(adj?: PhotoAdjustments): { filter: string; transform: string } {
  if (!adj) {
    return { filter: 'none', transform: 'none' };
  }

  // Base adjustments
  const brightness = 1 + (adj.brightness || 0) / 100;
  const contrast = 1 + (adj.contrast || 0) / 100;
  const saturation = 1 + (adj.saturation || 0) / 100;
  const exposure = 1 + (adj.exposure || 0) / 100;
  const hue = adj.hue || 0;

  // Temperature & Tint
  const tempHue = adj.temperature ? adj.temperature * 0.25 : 0;
  const tintHue = adj.tint ? adj.tint * 0.2 : 0;
  const totalHue = hue + tempHue + tintHue;

  // Blur with blurType handling
  let blurVal = adj.blur ? adj.blur * 0.4 : 0;
  if (adj.blurType === 'motion') blurVal *= 1.2;
  const blurCss = blurVal > 0 ? `blur(${blurVal}px)` : '';

  // Filter preset
  const preset = FILTER_PRESETS.find(p => p.id === adj.filter);
  const presetFilter = preset?.css || '';

  // Effect preset additions
  let effectFilter = '';
  switch (adj.effect) {
    case 'glitch':
      effectFilter = 'invert(0.05) saturate(1.8) hue-rotate(40deg)';
      break;
    case 'sketch':
      effectFilter = 'grayscale(1) contrast(3.5) brightness(1.15)';
      break;
    case 'magic':
      effectFilter = 'brightness(1.15) saturate(1.4) drop-shadow(0 0 10px rgba(255,100,200,0.5))';
      break;
    case 'halftone':
      effectFilter = 'contrast(2.2) saturate(1.6)';
      break;
    case 'artistic':
      effectFilter = 'contrast(1.3) saturate(1.5) sepia(0.2)';
      break;
    case 'duotone':
      effectFilter = 'grayscale(0.6) contrast(1.7) hue-rotate(180deg)';
      break;
  }

  // Curves preset additions
  let curveFilter = '';
  switch (adj.curveRgb) {
    case 'punch':
      curveFilter = 'contrast(1.25) brightness(0.96)';
      break;
    case 'matte':
      curveFilter = 'contrast(0.88) brightness(1.08) sepia(0.15)';
      break;
    case 'cross':
      curveFilter = 'contrast(1.22) hue-rotate(20deg) saturate(1.25)';
      break;
    case 'deep_black':
      curveFilter = 'contrast(1.4) brightness(0.88)';
      break;
  }

  // Retouch & Beautify additions
  const glowDrop = adj.faceGlow ? `drop-shadow(0 0 ${adj.faceGlow * 0.15}px rgba(255,220,180,0.6))` : '';
  const teethFilter = adj.teethWhitening ? `brightness(${1 + adj.teethWhitening * 0.003}) saturate(${1 - adj.teethWhitening * 0.002})` : '';

  // HSL Color Channel shifts
  const hslTotalHueShift = ((adj.hslRed || 0) * 0.15) + ((adj.hslGreen || 0) * 0.1) + ((adj.hslBlue || 0) * 0.15);
  const hslTotalSatShift = 1 + (((adj.hslRed || 0) + (adj.hslBlue || 0) + (adj.hslYellow || 0)) / 300);

  // Sharpen effect via SVG / contrast unsharp
  const sharpenFilter = adj.sharpen ? `contrast(${1 + (adj.sharpen / 100) * 0.35})` : '';

  // Highlights & Shadows
  const highlightsFilter = adj.highlights ? `brightness(${1 + (adj.highlights / 100) * 0.15})` : '';
  const shadowsFilter = adj.shadows ? `contrast(${1 - (adj.shadows / 100) * 0.12})` : '';

  const customFilter = `brightness(${brightness * exposure}) contrast(${contrast}) saturate(${saturation * hslTotalSatShift}) hue-rotate(${totalHue + hslTotalHueShift}deg) ${blurCss}`.trim();

  const fullFilter = [
    presetFilter,
    effectFilter,
    curveFilter,
    customFilter,
    glowDrop,
    teethFilter,
    sharpenFilter,
    highlightsFilter,
    shadowsFilter,
  ].filter(Boolean).join(' ');

  // Transforms: Flips, Rotation, Skew
  const scaleX = adj.flipH ? -1 : 1;
  const scaleY = adj.flipV ? -1 : 1;
  const rot = adj.rotationAngle || 0;
  const skewX = adj.perspectiveSkewX || 0;
  const skewY = adj.perspectiveSkewY || 0;

  let transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
  if (rot !== 0) transform += ` rotate(${rot}deg)`;
  if (skewX !== 0 || skewY !== 0) transform += ` skew(${skewX}deg, ${skewY}deg)`;

  return { filter: fullFilter || 'none', transform };
}



// =================== DYNAMIC GOOGLE FONT LOADER ===================
const LOADED_FONTS = new Set<string>();

export function getCleanFontFamily(fontFamily?: string): string {
  if (!fontFamily) return "'Caveat', cursive, sans-serif";
  const trimmed = fontFamily.trim();
  // Strip parenthetical descriptors e.g. "Caveat (Casual Handwriting)" -> "Caveat"
  const clean = trimmed.replace(/\(.*?\)/g, '').replace(/['"]/g, '').split(',')[0].trim();
  return `'${clean}', cursive, sans-serif`;
}

export function loadGoogleFont(fontFamily: string) {
  if (!fontFamily) return;
  const cleanName = fontFamily
    .replace(/\(.*?\)/g, '')
    .replace(/['"]/g, '')
    .split(',')[0]
    .trim();

  if (!cleanName || LOADED_FONTS.has(cleanName)) return;
  LOADED_FONTS.add(cleanName);

  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName).replace(/%20/g, '+')}&display=swap`;
    document.head.appendChild(link);
  } catch (err) {
    console.warn('Failed to load font:', fontFamily, err);
  }
}

// =================== TEXT-TO-SPEECH (TTS) PREVIEW ===================
export function speakText(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Curated Caption & Idea Presets
export const CAPTION_PRESETS: { category: string; icon: string; captions: string[] }[] = [
  {
    category: '💖 Love & Soulmate',
    icon: '💖',
    captions: [
      'Forever isn’t long enough with you ♡',
      'You are my favorite notification 💕',
      'Living rent-free in my heart forever 🫀',
      'Soulmates since day one ✨',
      'I choose you in every universe 🪐',
      'Together is our favorite place to be 🌸',
      'My safe space in human form 🧸',
      'Every love story is beautiful, but ours is my favorite 💌',
    ],
  },
  {
    category: '🔥 Flex & Cool',
    icon: '🔥',
    captions: [
      'Living life in full color 🌈',
      'Catch flights, not feelings ✈️',
      'Too glam to give a damn 💅',
      'Making history one spot at a time 👑',
      'No caption needed, the vibe speaks ⚡',
      'Energy never lies 🔥',
      'Silent moves, loud results 🏆',
      'Rare as an unreleased track 💎',
    ],
  },
  {
    category: '✨ Aesthetic & Chill',
    icon: '✨',
    captions: [
      'Soft moments, loud memories ☕',
      'Golden hour state of mind ☀️',
      'Dreaming with eyes wide open 🌙',
      'Find beauty in the ordinary 🌿',
      'Keep it simple, keep it honest 💫',
      'Chasing sunsets & peace 🌊',
      'Romanticizing my everyday life ☁️',
      'Gentle thoughts & gentle days 🕊️',
    ],
  },
  {
    category: '😂 Humor & Memes',
    icon: '😂',
    captions: [
      'I came, I saw, I forgot what I was doing 🐸',
      'Professional overthinker since 2024 🧠',
      'Fueled by iced coffee & questionable choices ☕',
      'Pizza is my love language 🍕',
      'Warning: Unfiltered chaotic good 💥',
      'Just here for the stickers 😎',
      'Main character syndrome in 4K 🍿',
      'My dog said I look fantastic today 🐶',
    ],
  },
  {
    category: '📍 Milestones & Dates',
    icon: '📍',
    captions: [
      'Claimed on SpotPop 2026 🎯',
      'A moment etched in time 🕰️',
      'Chapter 1 of forever 📖',
      'Here is where the magic happened 🪄',
      'Best memories are yet to come ⭐',
      'Marking our territory on the web 🚀',
      'We made it. Time to celebrate 🥂',
      'Started from an idea, now here 💡',
    ],
  },
];
