import fs from 'fs';
import path from 'path';
import type { Spot, User, Order, ModerationReport, ActivityEvent, CanvasStats, ProductTier } from '../src/types/index.ts';
import { PRODUCTS } from '../src/types/index.ts';

interface DatabaseSchema {
  users: User[];
  spots: Spot[];
  orders: Order[];
  reports: ModerationReport[];
  activity: ActivityEvent[];
  systemSettings: {
    maintenanceMode: boolean;
    allowNewClaims: boolean;
    testPaymentMode: boolean;
    maxCanvasSize: number;
    initialOffsetClaims: number; // Base offset to display community size
  };
}

const DB_FILE = path.resolve(process.cwd(), 'server-db.json');

// Initial seed data inspired directly by SpotPop canvas screenshot
const INITIAL_SPOTS: Spot[] = [
  {
    id: 'sp_spotpop_hero',
    ownerId: 'usr_admin',
    creatorName: 'SpotPop Team',
    slug: 'spotpop-origin',
    tier: 'big_pop',
    x: 0,
    y: 160,
    width: 290,
    height: 140,
    rotation: -2,
    shape: 'graffiti',
    background: 'linear-gradient(135deg, #FF1493, #FF007F)',
    content: {
      headline: 'SPOTPOP',
      text: 'CLAIM YOUR SPOT ON THE INTERNET',
      author: 'SpotPop HQ',
      textColor: '#FFFFFF',
      fontFamily: 'Permanent Marker',
      fontSize: 34,
      alignment: 'center',
      stickers: [
        { id: 'stk_1', emojiOrIcon: '👑', x: 20, y: 15, size: 28, rotation: -12 },
        { id: 'stk_2', emojiOrIcon: '✨', x: 245, y: 85, size: 24, rotation: 15 },
      ],
      frameStyle: 'neon',
      badge: 'ORIGIN',
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 14209,
    sharesCount: 3840,
  },
  {
    id: 'sp_riya_kabir',
    ownerId: 'usr_riya',
    creatorName: 'Riya & Kabir',
    slug: 'riya-kabir-2024',
    tier: 'mini_pop',
    x: -30,
    y: -300,
    width: 175,
    height: 175,
    rotation: 2.5,
    shape: 'sticky',
    background: '#FF80BF',
    content: {
      headline: 'Riya ♡ Kabir',
      text: 'Since 2024 ♡',
      author: 'Riya & Kabir',
      textColor: '#2E0854',
      fontFamily: 'Caveat',
      fontSize: 28,
      alignment: 'center',
      stickers: [
        { id: 'stk_heart', emojiOrIcon: '💖', x: 135, y: 20, size: 22, rotation: 10 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-02T14:22:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 3820,
    sharesCount: 910,
  },
  {
    id: 'sp_vivek_polaroid',
    ownerId: 'usr_vivek',
    creatorName: 'Vivek',
    slug: 'vivek-vibes',
    tier: 'big_pop',
    x: -240,
    y: -140,
    width: 220,
    height: 270,
    rotation: -4,
    shape: 'polaroid',
    background: '#FFFFFF',
    content: {
      headline: 'Vivek ♡',
      text: 'Living on the edge of the internet.',
      author: 'Vivek',
      textColor: '#1A1A1A',
      fontFamily: 'Caveat',
      fontSize: 24,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      imageFit: 'cover',
      stickers: [
        { id: 'stk_crown', emojiOrIcon: '👑', x: 18, y: 15, size: 30, rotation: -18 },
      ],
      frameStyle: 'tape',
      badge: 'FEATURED',
    },
    createdAt: '2026-11-03T09:15:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 8490,
    sharesCount: 2150,
  },
  {
    id: 'sp_david_bubblegum',
    ownerId: 'usr_artlover',
    creatorName: 'Renaissance Pop',
    slug: 'david-shades-bubblegum',
    tier: 'big_pop',
    x: 180,
    y: -180,
    width: 230,
    height: 280,
    rotation: 3,
    shape: 'classic',
    background: '#1F2438',
    borderColor: '#FF2E93',
    content: {
      headline: 'Classics Never Die',
      text: 'Chew bubblegum & conquer world.',
      author: 'Florence Studio',
      textColor: '#FFFFFF',
      fontFamily: 'Outfit',
      fontSize: 16,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_glasses', emojiOrIcon: '🕶️', x: 80, y: 70, size: 38, rotation: 0 },
        { id: 'stk_bubble', emojiOrIcon: '🫧', x: 110, y: 110, size: 32, rotation: 0 },
        { id: 'stk_heart_8bit', emojiOrIcon: '❤️‍🔥', x: 180, y: 22, size: 26, rotation: 12 },
      ],
      frameStyle: 'washi',
    },
    createdAt: '2026-11-02T19:40:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 9410,
    sharesCount: 3120,
  },
  {
    id: 'sp_just_a_cat',
    ownerId: 'usr_cat',
    creatorName: 'Just a Cat',
    slug: 'just-a-cat-glasses',
    tier: 'big_pop',
    x: 230,
    y: 110,
    width: 190,
    height: 240,
    rotation: -3,
    shape: 'polaroid',
    background: '#FFFFFF',
    content: {
      headline: 'Just a Cat 😎',
      text: 'Meow meow, no thoughts just treats.',
      author: 'Captain Whiskers',
      textColor: '#1E293B',
      fontFamily: 'Outfit',
      fontSize: 18,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_glasses_cat', emojiOrIcon: '🕶️', x: 60, y: 55, size: 36, rotation: 0 },
      ],
      frameStyle: 'tape',
    },
    createdAt: '2026-11-03T16:10:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 7120,
    sharesCount: 1980,
  },
  {
    id: 'sp_naruto_forever',
    ownerId: 'usr_aryan',
    creatorName: 'Aryan',
    slug: 'naruto-forever',
    tier: 'mini_pop',
    x: -180,
    y: 140,
    width: 170,
    height: 160,
    rotation: -5,
    shape: 'sticky',
    background: '#FFD700',
    content: {
      headline: 'Naruto Forever! ♡',
      text: 'Believe it! 🍥 Dattebayo!',
      author: 'Aryan',
      textColor: '#5B2C00',
      fontFamily: 'Caveat',
      fontSize: 26,
      alignment: 'center',
      stickers: [
        { id: 'stk_ramen', emojiOrIcon: '🍥', x: 125, y: 18, size: 24, rotation: 0 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-03T11:04:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 4500,
    sharesCount: 1230,
  },
  {
    id: 'sp_ahmedabad',
    ownerId: 'usr_pooja',
    creatorName: 'Pooja',
    slug: 'from-ahmedabad',
    tier: 'mini_pop',
    x: 80,
    y: 80,
    width: 165,
    height: 165,
    rotation: 1,
    shape: 'sticky',
    background: '#FFF8E7',
    content: {
      headline: 'From Ahmedabad ♡',
      text: 'Sabarmati sunset & chai vibes ☕',
      author: 'Pooja',
      textColor: '#3A2E2B',
      fontFamily: 'Caveat',
      fontSize: 24,
      alignment: 'center',
      stickers: [
        { id: 'stk_chai', emojiOrIcon: '☕', x: 120, y: 110, size: 24, rotation: 8 },
      ],
      frameStyle: 'tape',
    },
    createdAt: '2026-11-03T13:45:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 3100,
    sharesCount: 840,
  },
  {
    id: 'sp_good_vibes',
    ownerId: 'usr_dev',
    creatorName: 'Dev',
    slug: 'good-vibes-only',
    tier: 'mini_pop',
    x: 320,
    y: -40,
    width: 155,
    height: 155,
    rotation: 4,
    shape: 'sticky',
    background: '#FFE066',
    content: {
      headline: 'Good Vibes Only ✌️',
      text: 'Stay hydrated & dream big!',
      author: 'Dev',
      textColor: '#332700',
      fontFamily: 'Caveat',
      fontSize: 25,
      alignment: 'center',
      stickers: [
        { id: 'stk_peace', emojiOrIcon: '✌️', x: 115, y: 20, size: 22, rotation: 12 },
        { id: 'stk_sun', emojiOrIcon: '✨', x: 20, y: 110, size: 20, rotation: 0 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-03T18:00:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 2900,
    sharesCount: 670,
  },
  {
    id: 'sp_chasing_dreams',
    ownerId: 'usr_sid',
    creatorName: 'Siddharth',
    slug: 'chasing-dreams',
    tier: 'mini_pop',
    x: 410,
    y: -170,
    width: 170,
    height: 150,
    rotation: -2,
    shape: 'sticky',
    background: '#FFB3BA',
    content: {
      headline: 'Chasing Dreams... ♡',
      text: 'Never let anyone dull your shine ✨',
      author: 'Siddharth',
      textColor: '#4A1521',
      fontFamily: 'Caveat',
      fontSize: 24,
      alignment: 'center',
      stickers: [
        { id: 'stk_star', emojiOrIcon: '⭐', x: 130, y: 15, size: 22, rotation: 15 },
      ],
      frameStyle: 'tape',
    },
    createdAt: '2026-11-02T11:20:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 3450,
    sharesCount: 880,
  },
  {
    id: 'sp_anime_art',
    ownerId: 'usr_akira',
    creatorName: 'Akira',
    slug: 'anime-art-girl',
    tier: 'big_pop',
    x: 440,
    y: 70,
    width: 210,
    height: 290,
    rotation: 2,
    shape: 'classic',
    background: '#181424',
    content: {
      headline: 'ART ♡',
      text: 'Lo-fi beats to code and chill.',
      author: 'Akira',
      textColor: '#FF7AC6',
      fontFamily: 'Outfit',
      fontSize: 20,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_hp', emojiOrIcon: '🎧', x: 20, y: 20, size: 28, rotation: -10 },
        { id: 'stk_game', emojiOrIcon: '🎮', x: 160, y: 240, size: 26, rotation: 10 },
      ],
      frameStyle: 'neon',
    },
    createdAt: '2026-11-01T21:00:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 8200,
    sharesCount: 2400,
  },
  {
    id: 'sp_doge_space',
    ownerId: 'usr_crypto',
    creatorName: 'Doge Cadet',
    slug: 'doge-in-space',
    tier: 'big_pop',
    x: -30,
    y: -40,
    width: 180,
    height: 200,
    rotation: -1,
    shape: 'cutout',
    background: '#FFFAED',
    content: {
      headline: 'Much Wow 🚀',
      text: 'Such space, very internet.',
      author: 'Doge Cadet',
      textColor: '#854D0E',
      fontFamily: 'Outfit',
      fontSize: 16,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_rocket', emojiOrIcon: '🚀', x: 130, y: 15, size: 26, rotation: 25 },
        { id: 'stk_planet', emojiOrIcon: '🪐', x: 15, y: 140, size: 24, rotation: -10 },
      ],
      frameStyle: 'washi',
    },
    createdAt: '2026-11-02T08:30:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 6400,
    sharesCount: 1890,
  },
  {
    id: 'sp_sunset_polaroid',
    ownerId: 'usr_tanvi',
    creatorName: 'Tanvi',
    slug: 'golden-sunset-couple',
    tier: 'big_pop',
    x: -80,
    y: -180,
    width: 170,
    height: 210,
    rotation: 3,
    shape: 'polaroid',
    background: '#FFFFFF',
    content: {
      headline: 'Forever Dusk ♡',
      text: 'Chasing horizons together.',
      author: 'Tanvi',
      textColor: '#334155',
      fontFamily: 'Caveat',
      fontSize: 20,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_sun_emoji', emojiOrIcon: '🌅', x: 125, y: 10, size: 20, rotation: 0 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-03T17:15:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 5200,
    sharesCount: 1400,
  },
  {
    id: 'sp_pepe_chill',
    ownerId: 'usr_frog',
    creatorName: 'Pepe',
    slug: 'pepe-cool-chill',
    tier: 'mini_pop',
    x: -330,
    y: 110,
    width: 160,
    height: 160,
    rotation: 4,
    shape: 'sticky',
    background: '#9AE6B4',
    content: {
      headline: 'Comfy Zone 🐸',
      text: 'Feels good man.',
      author: 'Pepe',
      textColor: '#1A4731',
      fontFamily: 'Outfit',
      fontSize: 20,
      alignment: 'center',
      stickers: [
        { id: 'stk_frog_glasses', emojiOrIcon: '🕶️', x: 55, y: 50, size: 34, rotation: 0 },
        { id: 'stk_leaf', emojiOrIcon: '🍃', x: 120, y: 120, size: 20, rotation: 10 },
      ],
      frameStyle: 'tape',
    },
    createdAt: '2026-11-02T22:00:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 4900,
    sharesCount: 1150,
  },
  {
    id: 'sp_great_wave',
    ownerId: 'usr_hokusai',
    creatorName: 'Kanagawa Wave',
    slug: 'the-great-wave',
    tier: 'big_pop',
    x: -380,
    y: -80,
    width: 200,
    height: 190,
    rotation: -3,
    shape: 'classic',
    background: '#0F172A',
    borderColor: '#38BDF8',
    content: {
      headline: 'Ocean Power',
      text: 'Riding every wave that comes.',
      author: 'Hokusai Fan',
      textColor: '#BAE6FD',
      fontFamily: 'Outfit',
      fontSize: 16,
      alignment: 'center',
      imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
      stickers: [
        { id: 'stk_wave_crown', emojiOrIcon: '👑', x: 15, y: 15, size: 24, rotation: -15 },
        { id: 'stk_water', emojiOrIcon: '🌊', x: 150, y: 145, size: 22, rotation: 0 },
      ],
      frameStyle: 'washi',
    },
    createdAt: '2026-11-01T15:20:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 6700,
    sharesCount: 1720,
  },
  {
    id: 'sp_retro_gamepad',
    ownerId: 'usr_gamer',
    creatorName: 'Rohan',
    slug: 'retro-game-pad',
    tier: 'mini_pop',
    x: -80,
    y: 190,
    width: 170,
    height: 120,
    rotation: 5,
    shape: 'sticky',
    background: '#E2E8F0',
    content: {
      headline: 'Player 1 🎮',
      text: 'Insert coin to play!',
      author: 'Rohan',
      textColor: '#334155',
      fontFamily: 'Outfit',
      fontSize: 18,
      alignment: 'center',
      stickers: [
        { id: 'stk_controller', emojiOrIcon: '🕹️', x: 120, y: 35, size: 26, rotation: 10 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-03T19:30:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 3800,
    sharesCount: 940,
  },
  {
    id: 'sp_gengar_ghost',
    ownerId: 'usr_ghost',
    creatorName: 'Shadow',
    slug: 'gengar-grin',
    tier: 'mini_pop',
    x: -330,
    y: 20,
    width: 160,
    height: 150,
    rotation: -4,
    shape: 'sticky',
    background: '#D6BCFA',
    content: {
      headline: 'Spooky Good 👻',
      text: 'Midnight mischief guaranteed.',
      author: 'Shadow',
      textColor: '#44337A',
      fontFamily: 'Caveat',
      fontSize: 24,
      alignment: 'center',
      stickers: [
        { id: 'stk_ghost_emoji', emojiOrIcon: '😈', x: 115, y: 15, size: 24, rotation: 12 },
      ],
      frameStyle: 'pin',
    },
    createdAt: '2026-11-02T23:15:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 4100,
    sharesCount: 1020,
  },
];

// Generate additional background mini stickies to form dense vibrant collage
const COLORS = [
  '#FEF08A', '#FDE047', '#FECDD3', '#FBCFE8', '#F5D0FE',
  '#E9D5FF', '#DDD6FE', '#C7D2FE', '#BFDBFE', '#BAE6FD',
  '#A7F3D0', '#BBF7D0', '#FED7AA', '#FFEDD5', '#FFFFFF'
];
const QUOTES = [
  'Dream big ♡', 'Code all night', 'Be kind always', 'Mumbai to Delhi 🚂',
  'Coffee > Sleep ☕', 'Just keep swimming', 'Stay curious ✨', 'Music is life 🎵',
  'Never give up!', 'Sunny days ☀️', 'Love you 3000', 'Blink and you miss',
  'Peace & calm 🌿', 'Future is bright', 'Keep smiling :)', 'Wild & free',
  'Pizza lover 🍕', 'Art is rebellion', 'Gotta catch em all', 'Travel more ✈️',
  'Breathe in, breathe out', 'Good morning world!', 'Hello SpotPop!', 'Happy thoughts only'
];

for (let i = 0; i < 45; i++) {
  const angle = (i / 45) * Math.PI * 2 + (i % 3) * 0.2;
  const radius = 450 + (i % 5) * 80 + Math.random() * 60;
  const x = Math.round(Math.cos(angle) * radius);
  const y = Math.round(Math.sin(angle) * radius);
  const color = COLORS[i % COLORS.length];
  const quote = QUOTES[i % QUOTES.length];

  INITIAL_SPOTS.push({
    id: `sp_bg_${i + 1}`,
    ownerId: `usr_demo_${i % 10}`,
    creatorName: `Pop_${i + 101}`,
    slug: `spot-${i + 101}`,
    tier: 'mini_pop',
    x,
    y,
    width: 130 + (i % 3) * 10,
    height: 130 + (i % 2) * 10,
    rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
    shape: 'sticky',
    background: color,
    content: {
      headline: quote,
      text: `Spot #${i + 200}`,
      author: `Pop_${i + 101}`,
      textColor: '#1E293B',
      fontFamily: i % 2 === 0 ? 'Caveat' : 'Outfit',
      fontSize: 20,
      alignment: 'center',
      stickers: [
        { id: `s_${i}`, emojiOrIcon: i % 3 === 0 ? '♡' : i % 3 === 1 ? '✨' : '✌️', x: 100, y: 15, size: 18, rotation: 0 }
      ],
      frameStyle: i % 2 === 0 ? 'tape' : 'pin',
    },
    createdAt: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString(),
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 100 + i * 15,
    sharesCount: 10 + i * 2,
  });
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@spotpop.in',
    username: 'admin',
    displayName: 'SpotPop Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    createdAt: '2026-11-01T00:00:00.000Z',
    ownedSpotIds: ['sp_spotpop_hero'],
  },
  {
    id: 'usr_vivek',
    email: 'vivek@spotpop.in',
    username: 'vivek',
    displayName: 'Vivek',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'user',
    createdAt: '2026-11-03T09:00:00.000Z',
    ownedSpotIds: ['sp_vivek_polaroid'],
  },
  {
    id: 'usr_riya',
    email: 'riya@spotpop.in',
    username: 'riya',
    displayName: 'Riya',
    role: 'user',
    createdAt: '2026-11-02T14:00:00.000Z',
    ownedSpotIds: ['sp_riya_kabir'],
  },
];

const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act_1',
    type: 'claimed',
    spotId: 'sp_vivek_polaroid',
    creatorName: 'Vivek',
    tier: 'big_pop',
    message: 'Vivek claimed a Big Pop Polaroid on the canvas!',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'act_2',
    type: 'claimed',
    spotId: 'sp_riya_kabir',
    creatorName: 'Riya & Kabir',
    tier: 'mini_pop',
    message: 'Riya & Kabir pinned their love note on the canvas.',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'act_3',
    type: 'shared',
    spotId: 'sp_david_bubblegum',
    creatorName: 'Renaissance Pop',
    tier: 'big_pop',
    message: 'Someone shared David Bubblegum to Instagram Story!',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: 'act_4',
    type: 'claimed',
    spotId: 'sp_just_a_cat',
    creatorName: 'Captain Whiskers',
    tier: 'big_pop',
    message: 'Just a Cat 😎 joined the SpotPop wall.',
    timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading db file, using fresh seeds', e);
    }
    const fresh: DatabaseSchema = {
      users: INITIAL_USERS,
      spots: INITIAL_SPOTS,
      orders: [],
      reports: [],
      activity: INITIAL_ACTIVITY,
      systemSettings: {
        maintenanceMode: false,
        allowNewClaims: true,
        testPaymentMode: true,
        maxCanvasSize: 10000,
        initialOffsetClaims: 234700, // Sync with visual counter in screenshot: ~2,34,721
      },
    };
    this.save(fresh);
    return fresh;
  }

  private save(data?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing db file', e);
    }
  }

  // Spots
  getSpots(): Spot[] {
    return this.data.spots.filter(s => s.status !== 'hidden');
  }

  getAllSpotsForAdmin(): Spot[] {
    return this.data.spots;
  }

  getSpotByIdOrSlug(idOrSlug: string): Spot | undefined {
    return this.data.spots.find(s => s.id === idOrSlug || s.slug === idOrSlug);
  }

  addSpot(spot: Spot): Spot {
    this.data.spots.push(spot);
    // Add activity
    this.addActivity({
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'claimed',
      spotId: spot.id,
      creatorName: spot.creatorName,
      tier: spot.tier,
      message: `${spot.creatorName} claimed a ${spot.tier === 'big_pop' ? 'Big Pop' : 'Mini Pop'} on SpotPop!`,
      timestamp: new Date().toISOString(),
    });
    this.save();
    return spot;
  }

  updateSpot(id: string, updates: Partial<Spot>): Spot | null {
    const idx = this.data.spots.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.spots[idx] = { ...this.data.spots[idx], ...updates };
    this.save();
    return this.data.spots[idx];
  }

  incrementSpotViews(id: string) {
    const spot = this.data.spots.find(s => s.id === id);
    if (spot) {
      spot.viewsCount = (spot.viewsCount || 0) + 1;
      this.save();
    }
  }

  incrementSpotShares(id: string) {
    const spot = this.data.spots.find(s => s.id === id);
    if (spot) {
      spot.sharesCount = (spot.sharesCount || 0) + 1;
      this.addActivity({
        id: `act_${Date.now()}`,
        type: 'shared',
        spotId: spot.id,
        creatorName: spot.creatorName,
        tier: spot.tier,
        message: `${spot.creatorName}'s spot was just shared! 🚀`,
        timestamp: new Date().toISOString(),
      });
      this.save();
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Orders
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  addOrder(order: Order): Order {
    this.data.orders.push(order);
    this.save();
    return order;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.save();
    return this.data.orders[idx];
  }

  // Reports
  getReports(): ModerationReport[] {
    return this.data.reports;
  }

  addReport(report: ModerationReport): ModerationReport {
    this.data.reports.push(report);
    this.save();
    return report;
  }

  updateReport(id: string, updates: Partial<ModerationReport>): ModerationReport | null {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.reports[idx] = { ...this.data.reports[idx], ...updates };
    this.save();
    return this.data.reports[idx];
  }

  // Activity
  getActivity(): ActivityEvent[] {
    return this.data.activity.slice(-20).reverse();
  }

  addActivity(act: ActivityEvent) {
    this.data.activity.push(act);
    if (this.data.activity.length > 100) {
      this.data.activity = this.data.activity.slice(-50);
    }
    this.save();
  }

  // Placement Algorithm: Find next available coordinate with guaranteed non-overlapping spacing
  allocateCoordinate(width: number, height: number): { x: number; y: number; rotation: number } {
    const spots = this.data.spots.filter(s => s.status !== 'hidden');
    const PADDING = 28; // consistent gap between spots

    // Helper to check overlap with existing spots
    const checkCollision = (cx: number, cy: number, w: number, h: number) => {
      const left1 = cx - w / 2 - PADDING;
      const right1 = cx + w / 2 + PADDING;
      const top1 = cy - h / 2 - PADDING;
      const bottom1 = cy + h / 2 + PADDING;

      for (const s of spots) {
        const left2 = s.x - s.width / 2;
        const right2 = s.x + s.width / 2;
        const top2 = s.y - s.height / 2;
        const bottom2 = s.y + s.height / 2;

        const overlaps = !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
        if (overlaps) return true;
      }
      return false;
    };

    // Spiral search outward starting from slight random offset near center
    let angle = Math.random() * Math.PI * 2;
    let radius = 180;
    const stepRadius = 24;
    const stepAngle = 0.35;

    for (let i = 0; i < 600; i++) {
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      if (!checkCollision(x, y, width, height)) {
        // Subtle organic rotation angle (-3.5 to +3.5 deg)
        const rotation = Math.round((Math.random() * 7 - 3.5) * 10) / 10;
        return { x, y, rotation };
      }

      angle += stepAngle;
      radius += stepRadius / (1 + radius / 300);
    }

    // Fallback outer ring placement
    const fallbackRadius = 800 + Math.random() * 300;
    const fallbackAngle = Math.random() * Math.PI * 2;
    return {
      x: Math.round(Math.cos(fallbackAngle) * fallbackRadius),
      y: Math.round(Math.sin(fallbackAngle) * fallbackRadius),
      rotation: Math.round((Math.random() * 6 - 3) * 10) / 10,
    };
  }

  // System Stats
  getStats(): CanvasStats {
    const totalCapacity = 300000;
    const miniPopCount = this.data.spots.filter(s => s.tier === 'mini_pop').length;
    const bigPopCount = this.data.spots.filter(s => s.tier === 'big_pop').length;
    const actualClaimed = this.data.spots.length;
    const baseOffset = this.data.systemSettings.initialOffsetClaims || 234700;
    const claimedCount = baseOffset + actualClaimed;
    const spotsLeft = Math.max(0, totalCapacity - claimedCount);

    // Calculate revenue
    const revenueINR = this.data.orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.amountINR, 0) + (miniPopCount * PRODUCTS.mini_pop.priceINR) + (bigPopCount * PRODUCTS.big_pop.priceINR);

    return {
      onlineCount: 2486 + Math.floor(Math.sin(Date.now() / 60000) * 45), // realistic fluctuating online users
      claimedCount,
      spotsLeft,
      totalCapacity,
      miniPopCount,
      bigPopCount,
      totalRevenueINR: revenueINR,
    };
  }
}

export const db = new Database();
