import { PhotoAdjustments } from '../types';

export interface FilterPreset {
  id: NonNullable<PhotoAdjustments['filter']>;
  name: string;
  icon: string;
  description: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Normal', icon: '✨', description: 'Original colors' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Moody teal & orange tone' },
  { id: 'vintage', name: 'Vintage 70s', icon: '📼', description: 'Warm nostalgic sepia tone' },
  { id: 'retro', name: 'Retro VHS', icon: '📺', description: '80s analog vibrant hue' },
  { id: 'noir', name: 'Film Noir', icon: '🎞️', description: 'Deep contrast black & white' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', description: 'Neon magenta & cyan glow' },
  { id: 'pastel', name: 'Pastel Dream', icon: '🌸', description: 'Soft dreamy low contrast' },
  { id: 'glitch', name: 'Glitch Art', icon: '👾', description: 'Chromatic electric fringe' },
  { id: 'sketch', name: 'Artistic Sketch', icon: '✏️', description: 'Monochrome charcoal style' },
  { id: 'warm', name: 'Golden Hour', icon: '☀️', description: 'Warm sunlit radiant glow' },
];

export function getPhotoFilterStyle(adj?: PhotoAdjustments): { filter: string; transform: string } {
  if (!adj) {
    return { filter: 'none', transform: 'none' };
  }

  const brightness = 1 + (adj.brightness || 0) / 100;
  const contrast = 1 + (adj.contrast || 0) / 100;
  const saturation = 1 + (adj.saturation || 0) / 100;
  const exposure = 1 + (adj.exposure || 0) / 100;
  const hue = adj.hue || 0;
  const blur = adj.blur ? `${adj.blur * 0.4}px` : '0px';

  // White balance: temperature (cool <-> warm) and tint (green <-> magenta)
  const tempHue = adj.temperature ? adj.temperature * 0.25 : 0;
  const totalHue = hue + tempHue;

  // Preset filter CSS
  let presetFilter = '';
  switch (adj.filter) {
    case 'cinematic':
      presetFilter = 'contrast(1.18) saturate(1.22) sepia(0.12)';
      break;
    case 'vintage':
      presetFilter = 'sepia(0.38) contrast(0.92) brightness(1.05)';
      break;
    case 'retro':
      presetFilter = 'saturate(1.45) contrast(1.12) hue-rotate(-12deg)';
      break;
    case 'noir':
      presetFilter = 'grayscale(1) contrast(1.35) brightness(0.92)';
      break;
    case 'cyberpunk':
      presetFilter = 'hue-rotate(180deg) saturate(1.85) contrast(1.25)';
      break;
    case 'pastel':
      presetFilter = 'brightness(1.12) saturate(0.85) contrast(0.92)';
      break;
    case 'glitch':
      presetFilter = 'invert(0.08) saturate(2.1) hue-rotate(90deg)';
      break;
    case 'sketch':
      presetFilter = 'grayscale(1) contrast(3.2) brightness(1.1)';
      break;
    case 'warm':
      presetFilter = 'sepia(0.24) saturate(1.35) brightness(1.08)';
      break;
    default:
      presetFilter = '';
  }

  // Retouch smooth effect: subtle brightness + contrast softening
  const smoothFilter = adj.retouchSmooth ? `drop-shadow(0 0 ${adj.retouchSmooth * 0.1}px rgba(255,255,255,0.4))` : '';

  const customFilter = `brightness(${brightness * exposure}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${totalHue}deg) blur(${blur})`;
  const fullFilter = [presetFilter, customFilter, smoothFilter].filter(Boolean).join(' ');

  // Flip transforms
  const scaleX = adj.flipH ? -1 : 1;
  const scaleY = adj.flipV ? -1 : 1;
  const transform = `scaleX(${scaleX}) scaleY(${scaleY})`;

  return { filter: fullFilter, transform };
}

// AI Caption & Text Generator Presets
export const AI_CAPTION_PRESETS: { category: string; icon: string; captions: string[] }[] = [
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
    ],
  },
];
