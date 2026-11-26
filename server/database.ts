import fs from 'fs';
import path from 'path';
import type { Spot, User, Order, ModerationReport, ActivityEvent, CanvasStats, ProductTier, Comment, FollowRelation, FollowStatus } from '../src/types/index.ts';
import { PRODUCTS } from '../src/types/index.ts';
import { SpatialIndex } from './spatialIndex.ts';
import { imageService } from './imageService.ts';
import { audioService } from './audioService.ts';

interface DatabaseSchema {
  users: User[];
  spots: Spot[];
  orders: Order[];
  reports: ModerationReport[];
  activity: ActivityEvent[];
  comments?: Comment[];
  follows?: FollowRelation[];
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
        { id: 'stk_1', emojiOrIcon: '🎯', x: 20, y: 15, size: 28, rotation: -12 },
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
    y: -377,
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
    x: -233,
    y: -161,
    width: 170,
    height: 210,
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
    x: 169,
    y: -180,
    width: 170,
    height: 210,
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
        { id: 'stk_bubble', emojiOrIcon: '🫧', x: 105, y: 95, size: 30, rotation: 0 },
        { id: 'stk_heart_8bit', emojiOrIcon: '❤️‍🔥', x: 130, y: 22, size: 26, rotation: 12 },
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
    x: 244,
    y: 135,
    width: 170,
    height: 210,
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
    x: -226,
    y: 151,
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
    x: 94,
    y: 11,
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
    x: 316,
    y: -31,
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
    y: -167,
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
    x: 412,
    y: 134,
    width: 170,
    height: 210,
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
        { id: 'stk_game', emojiOrIcon: '🎮', x: 130, y: 165, size: 26, rotation: 10 },
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
    x: -58,
    y: -10,
    width: 170,
    height: 210,
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
    y: -204,
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
    x: -375,
    y: 140,
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
    x: -396,
    y: -80,
    width: 170,
    height: 210,
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
    y: 287,
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
    x: -249,
    y: 1,
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
  private spatialIndex: SpatialIndex = new SpatialIndex(500);

  public isPersistent: boolean = true;

  constructor(isPersistent: boolean = true) {
    this.isPersistent = isPersistent;
    this.data = this.load();
    this.rebuildSpatialIndex();
  }

  private rebuildSpatialIndex() {
    this.spatialIndex.clear();
    this.spatialIndex.bulkInsert(this.data.spots);
  }

  private load(): DatabaseSchema {
    if (!this.isPersistent) {
      return {
        users: JSON.parse(JSON.stringify(INITIAL_USERS)),
        spots: JSON.parse(JSON.stringify(INITIAL_SPOTS)),
        orders: [],
        reports: [],
        activity: JSON.parse(JSON.stringify(INITIAL_ACTIVITY)),
        comments: [],
        follows: [],
        systemSettings: {
          maintenanceMode: false,
          allowNewClaims: true,
          testPaymentMode: true,
          maxCanvasSize: 10000,
          initialOffsetClaims: 234700,
        },
      };
    }
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.comments = parsed.comments || [];
        parsed.follows = parsed.follows || [];

        // Ensure seed creators with private/friends_only spots are registered with Instagram private account settings
        const privateUserSeeds = [
          { id: 'usr_mira_c', username: 'Mira_C', displayName: 'Mira_C', isPrivate: true, bio: 'Visual artist & pop creator 🌸 Friends-only pops. Follow to unlock!' },
          { id: 'usr_neotokio', username: 'NeoTokio', displayName: 'NeoTokio', isPrivate: true, bio: 'Cyberpunk beats & midnight aesthetics 🌃' },
          { id: 'usr_simran_b', username: 'Simran_B', displayName: 'Simran_B', isPrivate: true, bio: 'Design & coffee notes ☕ Follow to unlock!' },
        ];
        parsed.users = parsed.users || [];
        for (const seed of privateUserSeeds) {
          const existing = parsed.users.find((u: any) => u.id?.toLowerCase() === seed.id.toLowerCase() || u.username?.toLowerCase() === seed.username.toLowerCase());
          if (existing) {
            if (existing.isPrivate === undefined) existing.isPrivate = true;
          } else {
            parsed.users.push({
              ...seed,
              role: 'user',
              createdAt: new Date().toISOString(),
              ownedSpotIds: [],
              followersCount: 0,
              followingCount: 0,
            });
          }
        }

        return parsed;
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
      comments: [],
      follows: [],
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

  public save(data?: DatabaseSchema) {
    if (!this.isPersistent) return;
    try {
      const payload = JSON.stringify(data || this.data, null, 2);
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tmpFile, payload, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      console.error('Error writing db file', e);
    }
  }

  public createBackup(): string | null {
    if (!this.isPersistent) return null;
    try {
      const backupDir = path.resolve(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `server-db-${timestamp}.json`);
      fs.copyFileSync(DB_FILE, backupPath);

      // Maintain rolling window of latest 7 daily snapshots
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('server-db-') && f.endsWith('.json'))
        .map(f => ({ name: f, path: path.join(backupDir, f), mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length > 7) {
        for (const file of files.slice(7)) {
          try { fs.unlinkSync(file.path); } catch {}
        }
      }
      return backupPath;
    } catch (err) {
      console.error('Failed to create database backup:', err);
      return null;
    }
  }

  public getBackupsList(): { filename: string; sizeBytes: number; createdAt: string }[] {
    try {
      const backupDir = path.resolve(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) return [];
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
      return files.map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  public restoreBackup(filename: string): boolean {
    try {
      const backupDir = path.resolve(process.cwd(), 'backups');
      const safeFilename = path.basename(filename);
      const targetPath = path.join(backupDir, safeFilename);
      if (!fs.existsSync(targetPath)) return false;
      const raw = fs.readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.spots)) {
        return false;
      }
      this.data = parsed;
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  // Spots
  getSpots(viewerIdOrName?: string): Spot[] {
    const rawViewer = (viewerIdOrName || '').trim().toLowerCase();
    return this.data.spots
      .filter(s => s.status !== 'hidden')
      .filter(s => {
        // If private, only owner or creator can view
        if (s.visibility === 'private') {
          if (!rawViewer) return false;
          const isOwner =
            s.ownerId?.toLowerCase() === rawViewer ||
            s.creatorName.toLowerCase() === rawViewer;
          return isOwner;
        }
        return true;
      })
      .map(s => {
        const creatorUser = s.ownerId ? this.getUserById(s.ownerId) : this.getUserByUsername(s.creatorName);
        const isPrivateCreator = creatorUser?.isPrivate ?? false;

        // If friends only or creator is private, check if viewer follows creator (accepted status) or is owner
        if (s.visibility === 'friends_only' || isPrivateCreator) {
          if (!rawViewer) {
            return { ...s, isLocked: true };
          }
          const isOwner =
            s.ownerId?.toLowerCase() === rawViewer ||
            s.creatorName.toLowerCase() === rawViewer;
          if (isOwner) return { ...s, isLocked: false };
          const isFollowing =
            this.isUserFollowing(rawViewer, s.creatorName) ||
            (s.ownerId ? this.isUserFollowing(rawViewer, s.ownerId) : false);
          return { ...s, isLocked: !isFollowing };
        }
        return s;
      });
  }

  getAllSpotsForAdmin(): Spot[] {
    return this.data.spots;
  }

  getSpotByIdOrSlug(idOrSlug: string): Spot | undefined {
    return this.data.spots.find(s => s.id === idOrSlug || s.slug === idOrSlug);
  }

  getSpotById(id: string): Spot | undefined {
    return this.data.spots.find(s => s.id === id);
  }

  addSpot(spot: Spot): Spot {
    this.data.spots.push(spot);
    this.spatialIndex.insert(spot);
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
    const oldSpot = this.data.spots[idx];
    this.data.spots[idx] = { ...this.data.spots[idx], ...updates };
    this.spatialIndex.insert(this.data.spots[idx]);
    this.save();

    // If media changed, immediately purge any orphaned files
    if (
      updates.content?.imageUrl !== undefined ||
      updates.content?.audio !== undefined
    ) {
      this.cleanupUnreferencedMedia();
    }

    return this.data.spots[idx];
  }

  deleteSpot(id: string): boolean {
    const initialLen = this.data.spots.length;
    this.data.spots = this.data.spots.filter(s => s.id !== id);
    if (this.data.spots.length !== initialLen) {
      this.spatialIndex.remove(id);
      this.save();
      // Immediately purge deleted spot's media files from disk
      this.cleanupUnreferencedMedia();
      return true;
    }
    return false;
  }

  deleteSpots(ids: string[]): number {
    const idsSet = new Set(ids);
    const initialLen = this.data.spots.length;
    this.data.spots = this.data.spots.filter(s => !idsSet.has(s.id));
    const deletedCount = initialLen - this.data.spots.length;
    if (deletedCount > 0) {
      for (const id of ids) {
        this.spatialIndex.remove(id);
      }
      this.save();
      // Immediately purge deleted spots' media files from disk
      this.cleanupUnreferencedMedia();
    }
    return deletedCount;
  }

  deleteAllSpots(): number {
    const total = this.data.spots.length;
    this.data.spots = [];
    this.spatialIndex.clear();
    this.save();
    // Immediately purge all spot media from disk
    this.cleanupUnreferencedMedia();
    return total;
  }

  /**
   * Scans all spots in database, finds all unreferenced image folders and audio files,
   * and permanently erases them from disk. Also cleans up redundant image files.
   */
  cleanupUnreferencedMedia(): { deletedImages: number; deletedAudio: number; freedBytes: number } {
    const activeHashes = new Set<string>();
    const activeAudioKeys = new Set<string>();

    const checkUrl = (url?: string) => {
      if (!url) return;
      const match = url.match(/\/uploads\/images\/([a-f0-9]+)\//i);
      if (match) activeHashes.add(match[1]);
    };

    for (const s of this.data.spots) {
      checkUrl(s.content?.imageUrl);
      if (Array.isArray(s.content?.layers)) {
        for (const l of s.content.layers) {
          checkUrl(l.imageUrl);
          checkUrl(l.content);
        }
      }
      if (s.content?.audio?.storageKey) {
        activeAudioKeys.add(s.content.audio.storageKey);
      }
      if (s.content?.audio?.url) {
        activeAudioKeys.add(path.basename(s.content.audio.url));
      }
    }

    // Also preserve media referenced in pending orders
    for (const o of this.data.orders) {
      checkUrl((o.spotDraft as any)?.imageUrl);
      checkUrl(o.spotDraft?.content?.imageUrl);
      if (Array.isArray(o.spotDraft?.content?.layers)) {
        for (const l of o.spotDraft.content.layers) {
          checkUrl(l.imageUrl);
          checkUrl(l.content);
        }
      }
    }

    const imgResult = imageService.cleanupOrphans(activeHashes);
    const audResult = audioService.cleanOrphanedAudio(activeAudioKeys, true);

    return {
      deletedImages: imgResult.deletedCount,
      deletedAudio: audResult.deletedCount,
      freedBytes: imgResult.freedBytes + audResult.freedBytes,
    };
  }

  queryViewport(minX: number, minY: number, maxX: number, maxY: number, limit: number = 2000, viewerIdOrName?: string): Spot[] {
    const rawSpots = this.spatialIndex.queryBBox(minX, minY, maxX, maxY, limit);
    const rawViewer = (viewerIdOrName || '').trim().toLowerCase();
    return rawSpots
      .filter(s => s.status !== 'hidden')
      .filter(s => {
        if (s.visibility === 'private') {
          if (!rawViewer) return false;
          return s.ownerId?.toLowerCase() === rawViewer || s.creatorName.toLowerCase() === rawViewer;
        }
        return true;
      })
      .map(s => {
        const creatorUser = s.ownerId ? this.getUserById(s.ownerId) : this.getUserByUsername(s.creatorName);
        const isPrivateCreator = creatorUser?.isPrivate ?? false;

        if (s.visibility === 'friends_only' || isPrivateCreator) {
          if (!rawViewer) return { ...s, isLocked: true };
          const isOwner = s.ownerId?.toLowerCase() === rawViewer || s.creatorName.toLowerCase() === rawViewer;
          if (isOwner) return { ...s, isLocked: false };
          const isFollowing = this.isUserFollowing(rawViewer, s.creatorName) || (s.ownerId ? this.isUserFollowing(rawViewer, s.ownerId) : false);
          return { ...s, isLocked: !isFollowing };
        }
        return s;
      });
  }

  reserveCoordinate(x: number, y: number, width: number, height: number, ttlMs: number = 300000): string {
    return this.spatialIndex.reserveCoordinate(x, y, width, height, ttlMs);
  }

  releaseReservation(id: string): void {
    this.spatialIndex.releaseReservation(id);
  }

  incrementSpotViews(id: string): Spot | null {
    const spot = this.data.spots.find(s => s.id === id);
    if (spot) {
      spot.viewsCount = (spot.viewsCount || 0) + 1;
      this.save();
      return spot;
    }
    return null;
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

  toggleSpotLike(id: string, increment: boolean = true) {
    const spot = this.data.spots.find(s => s.id === id);
    if (spot) {
      if (increment) {
        spot.likesCount = (spot.likesCount || 0) + 1;
        this.addActivity({
          id: `act_${Date.now()}`,
          type: 'liked',
          spotId: spot.id,
          creatorName: spot.creatorName,
          tier: spot.tier,
          message: `${spot.creatorName}'s spot received some love! ❤️`,
          timestamp: new Date().toISOString(),
        });
      } else {
        spot.likesCount = Math.max(0, (spot.likesCount || 1) - 1);
      }
      this.save();
      return spot;
    }
    return null;
  }

  getCommentsBySpotId(spotId: string): Comment[] {
    const all = this.data.comments || [];
    const spotComments = all.filter(c => c.spotId === spotId);
    const rootComments = spotComments.filter(c => !c.replyToId);
    return rootComments.map(root => ({
      ...root,
      replies: spotComments.filter(c => c.replyToId === root.id),
    }));
  }

  addComment(spotId: string, data: { authorName: string; text: string; replyToId?: string; authorAvatar?: string }): Comment {
    this.data.comments = this.data.comments || [];
    const comment: Comment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spotId,
      authorName: data.authorName || 'Spotter',
      authorAvatar: data.authorAvatar,
      text: data.text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      replyToId: data.replyToId,
    };
    this.data.comments.push(comment);

    const spot = this.data.spots.find(s => s.id === spotId);
    if (spot) {
      spot.commentsCount = (spot.commentsCount || 0) + 1;
    }
    this.save();
    return comment;
  }

  likeComment(commentId: string): Comment | null {
    this.data.comments = this.data.comments || [];
    const comment = this.data.comments.find(c => c.id === commentId);
    if (comment) {
      comment.likesCount = (comment.likesCount || 0) + 1;
      this.save();
      return comment;
    }
    return null;
  }

  addReaction(spotId: string, emoji: string): { spot: Spot; reactions: Record<string, number> } | null {
    const spot = this.data.spots.find(s => s.id === spotId);
    if (spot) {
      spot.reactions = spot.reactions || {};
      spot.reactions[emoji] = (spot.reactions[emoji] || 0) + 1;
      this.save();
      return { spot, reactions: spot.reactions };
    }
    return null;
  }

  getAllComments(): (Comment & { spotTitle?: string })[] {
    const comments = this.data.comments || [];
    const spotMap = new Map(this.data.spots.map(s => [s.id, s.content.headline || s.title || s.creatorName]));
    return comments.map(c => ({
      ...c,
      spotTitle: spotMap.get(c.spotId) || 'Untitled Spot',
    }));
  }

  deleteComment(commentId: string): boolean {
    this.data.comments = this.data.comments || [];
    const idx = this.data.comments.findIndex(c => c.id === commentId);
    if (idx === -1) return false;
    const comment = this.data.comments[idx];
    this.data.comments.splice(idx, 1);
    const spot = this.data.spots.find(s => s.id === comment.spotId);
    if (spot && spot.commentsCount && spot.commentsCount > 0) {
      spot.commentsCount -= 1;
    }
    this.save();
    return true;
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const oldUser = this.data.users[idx];
    const oldUsername = oldUser.username;

    this.data.users[idx] = { ...oldUser, ...updates };

    // If username changed, propagate to spots and follows
    if (updates.username && updates.username.toLowerCase() !== oldUsername.toLowerCase()) {
      const newUsername = updates.username.toLowerCase();
      // Update owned spots creatorName if matching oldUsername
      for (const s of this.data.spots) {
        if (s.ownerId === id || s.creatorName.toLowerCase() === oldUsername.toLowerCase()) {
          s.ownerId = id;
          if (updates.displayName) s.creatorName = updates.displayName;
        }
      }
      // Update follows relations
      for (const f of this.data.follows || []) {
        if (f.followerId.toLowerCase() === oldUsername.toLowerCase() || f.followerId.toLowerCase() === `usr_${oldUsername.toLowerCase()}`) {
          f.followerId = id;
        }
        if (f.followingId.toLowerCase() === oldUsername.toLowerCase() || f.followingId.toLowerCase() === `usr_${oldUsername.toLowerCase()}`) {
          f.followingId = id;
        }
      }
    }

    this.save();
    return this.data.users[idx];
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    // Also remove from follows graph
    if (this.data.follows) {
      this.data.follows = this.data.follows.filter(f => f.followerId !== id && f.followingId !== id);
    }
    this.save();
    return true;
  }

  deleteUsers(ids: string[]): number {
    const idSet = new Set(ids);
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => !idSet.has(u.id));
    if (this.data.follows) {
      this.data.follows = this.data.follows.filter(f => !idSet.has(f.followerId) && !idSet.has(f.followingId));
    }
    const deletedCount = initialLen - this.data.users.length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  // Follows & Social Graph
  normalizeUserKey(identifier: string): string {
    const raw = (identifier || '').trim().toLowerCase().replace(/^@/, '');
    const user = this.data.users.find(
      u => u.id.toLowerCase() === raw || u.username.toLowerCase() === raw || u.displayName.toLowerCase() === raw
    );
    if (user) return user.id;
    return `usr_${raw.replace(/[^a-z0-9_]/g, '_')}`;
  }

  followUser(followerInput: string, targetInput: string): {
    followStatus: FollowStatus;
    isFollowing: boolean;
    isRequested: boolean;
    followersCount: number;
    followingCount: number;
  } {
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const targetId = this.normalizeUserKey(targetInput);

    if (!followerId || !targetId || followerId.toLowerCase() === targetId.toLowerCase()) {
      const counts = this.getFollowCounts(targetInput);
      return { followStatus: 'not_following', isFollowing: false, isRequested: false, ...counts };
    }

    const existingIdx = this.data.follows.findIndex(
      f => (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase()) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    let followStatus: FollowStatus = 'not_following';

    if (existingIdx !== -1) {
      // Unfollow or Cancel Request
      this.data.follows.splice(existingIdx, 1);
      followStatus = 'not_following';
    } else {
      // Check if target account is private
      const targetUser = this.getUserById(targetId) || this.getUserByUsername(targetInput);
      const isPrivate = targetUser?.isPrivate ?? false;

      const followerUser = this.getUserById(followerId) || this.getUserByUsername(followerInput);
      const followerName = followerUser?.displayName || followerInput;
      const targetName = targetUser?.displayName || targetInput;

      if (isPrivate) {
        // Pending Follow Request (Instagram logic: approval required)
        followStatus = 'pending';
        this.data.follows.push({
          id: `flw_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          followerId,
          followingId: targetId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        this.addActivity({
          id: `act_${Date.now()}`,
          type: 'shared',
          spotId: 'network',
          creatorName: followerName,
          tier: 'mini_pop',
          message: `${followerName} requested to follow @${targetName}. 📩`,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Instant Follow for Public Profile
        followStatus = 'accepted';
        this.data.follows.push({
          id: `flw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          followerId,
          followingId: targetId,
          status: 'accepted',
          createdAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        });

        this.addActivity({
          id: `act_${Date.now()}`,
          type: 'shared',
          spotId: 'network',
          creatorName: followerName,
          tier: 'mini_pop',
          message: `${followerName} started following @${targetName}! ✨`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const counts = this.getFollowCounts(targetInput);

    // Sync counts back to User objects if present
    const tUser = this.data.users.find(u => u.id.toLowerCase() === targetId.toLowerCase() || u.username.toLowerCase() === targetInput.toLowerCase());
    if (tUser) tUser.followersCount = counts.followersCount;

    const fUser = this.data.users.find(u => u.id.toLowerCase() === followerId.toLowerCase() || u.username.toLowerCase() === followerInput.toLowerCase());
    if (fUser) {
      fUser.followingCount = this.data.follows.filter(
        f => (f.status === 'accepted' || !f.status) &&
          (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase())
      ).length;
    }

    this.save();
    return {
      followStatus,
      isFollowing: followStatus === 'accepted',
      isRequested: followStatus === 'pending',
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
    };
  }

  unfollowUser(followerInput: string, targetInput: string): {
    success: boolean;
    followStatus: FollowStatus;
    isFollowing: boolean;
    isRequested: boolean;
    followersCount: number;
    followingCount: number;
  } {
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const targetId = this.normalizeUserKey(targetInput);

    if (!followerId || !targetId) {
      const counts = this.getFollowCounts(targetInput);
      return {
        success: false,
        followStatus: 'not_following',
        isFollowing: false,
        isRequested: false,
        followersCount: counts.followersCount,
        followingCount: counts.followingCount,
      };
    }

    const initialLen = this.data.follows.length;
    this.data.follows = this.data.follows.filter(
      f => !(
        (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase()) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
      )
    );

    if (this.data.follows.length !== initialLen) {
      // Sync counts back to User records
      const counts = this.getFollowCounts(targetInput);
      const tUser = this.data.users.find(u => u.id.toLowerCase() === targetId.toLowerCase() || u.username.toLowerCase() === targetInput.toLowerCase());
      if (tUser) tUser.followersCount = counts.followersCount;

      const fUser = this.data.users.find(u => u.id.toLowerCase() === followerId.toLowerCase() || u.username.toLowerCase() === followerInput.toLowerCase());
      if (fUser) {
        fUser.followingCount = this.data.follows.filter(
          f => (f.status === 'accepted' || !f.status) &&
            (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase())
        ).length;
      }
      this.save();
    }

    const counts = this.getFollowCounts(targetInput);
    return {
      success: true,
      followStatus: 'not_following',
      isFollowing: false,
      isRequested: false,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
    };
  }

  getFollowStatus(followerInput?: string, targetInput?: string): FollowStatus {
    if (!followerInput || !targetInput) return 'not_following';
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const targetId = this.normalizeUserKey(targetInput);
    if (followerId.toLowerCase() === targetId.toLowerCase()) return 'not_following';

    const relation = this.data.follows.find(
      f => (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase()) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    if (!relation) return 'not_following';
    if (relation.status === 'pending') return 'pending';
    return 'accepted';
  }

  isUserFollowing(followerInput?: string, targetInput?: string): boolean {
    if (!followerInput || !targetInput) return false;
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const targetId = this.normalizeUserKey(targetInput);
    return this.data.follows.some(
      f => (f.status === 'accepted' || !f.status) &&
        (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase()) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );
  }

  getFollowRequests(targetInput: string): Array<{
    id: string;
    followerId: string;
    followingId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: string;
  }> {
    this.data.follows = this.data.follows || [];
    const targetId = this.normalizeUserKey(targetInput);
    const pendingRelations = this.data.follows.filter(
      f => f.status === 'pending' &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    return pendingRelations.map(r => {
      const u = this.getUserById(r.followerId) || this.getUserByUsername(r.followerId);
      const rawName = r.followerId.replace(/^usr_/, '');
      return {
        id: r.id,
        followerId: r.followerId,
        followingId: r.followingId,
        username: u?.username || rawName,
        displayName: u?.displayName || (rawName.startsWith('v_') ? 'Spot Explorer' : rawName),
        avatarUrl: u?.avatarUrl,
        createdAt: r.createdAt,
      };
    });
  }

  acceptFollowRequest(requestId: string, targetInput: string): {
    success: boolean;
    followerName: string;
    followerId: string;
    followersCount: number;
    followingCount: number;
  } | null {
    this.data.follows = this.data.follows || [];
    const targetId = this.normalizeUserKey(targetInput);

    const relation = this.data.follows.find(
      f => f.id === requestId &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    if (!relation) return null;

    relation.status = 'accepted';
    relation.acceptedAt = new Date().toISOString();

    const followerUser = this.getUserById(relation.followerId) || this.getUserByUsername(relation.followerId);
    const targetUser = this.getUserById(targetId) || this.getUserByUsername(targetInput);
    const followerName = followerUser?.displayName || relation.followerId;
    const targetName = targetUser?.displayName || targetInput;

    this.addActivity({
      id: `act_${Date.now()}`,
      type: 'shared',
      spotId: 'network',
      creatorName: targetName,
      tier: 'mini_pop',
      message: `@${targetName} accepted ${followerName}'s follow request! ✨`,
      timestamp: new Date().toISOString(),
    });

    const counts = this.getFollowCounts(targetInput);
    if (targetUser) targetUser.followersCount = counts.followersCount;
    if (followerUser) {
      followerUser.followingCount = this.data.follows.filter(
        f => (f.status === 'accepted' || !f.status) &&
          (f.followerId.toLowerCase() === followerUser.id.toLowerCase() || f.followerId.toLowerCase() === followerUser.username.toLowerCase())
      ).length;
    }

    this.save();
    return {
      success: true,
      followerName,
      followerId: relation.followerId,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
    };
  }

  declineFollowRequest(requestId: string, targetInput: string): boolean {
    this.data.follows = this.data.follows || [];
    const targetId = this.normalizeUserKey(targetInput);

    const idx = this.data.follows.findIndex(
      f => f.id === requestId &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    if (idx === -1) return false;

    this.data.follows.splice(idx, 1);
    this.save();
    return true;
  }

  removeFollower(followerInput: string, targetInput: string): boolean {
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const targetId = this.normalizeUserKey(targetInput);

    const idx = this.data.follows.findIndex(
      f => (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase()) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    if (idx === -1) return false;

    this.data.follows.splice(idx, 1);

    const counts = this.getFollowCounts(targetInput);
    const tUser = this.data.users.find(u => u.id.toLowerCase() === targetId.toLowerCase() || u.username.toLowerCase() === targetInput.toLowerCase());
    if (tUser) tUser.followersCount = counts.followersCount;

    const fUser = this.data.users.find(u => u.id.toLowerCase() === followerId.toLowerCase() || u.username.toLowerCase() === followerInput.toLowerCase());
    if (fUser) {
      fUser.followingCount = this.data.follows.filter(
        f => (f.status === 'accepted' || !f.status) &&
          (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase())
      ).length;
    }

    this.save();
    return true;
  }

  setAccountPrivacy(userInput: string, isPrivate: boolean): boolean {
    const user = this.getUserById(userInput) || this.getUserByUsername(userInput);
    if (!user) return false;
    user.isPrivate = isPrivate;
    this.save();
    return true;
  }

  getUserFollowers(targetInput: string): Array<{ id: string; username: string; displayName: string; avatarUrl?: string }> {
    this.data.follows = this.data.follows || [];
    const targetId = this.normalizeUserKey(targetInput);
    const relations = this.data.follows.filter(
      f => (f.status === 'accepted' || !f.status) &&
        (f.followingId.toLowerCase() === targetId.toLowerCase() || f.followingId.toLowerCase() === targetInput.toLowerCase())
    );

    return relations.map(r => {
      const u = this.getUserById(r.followerId);
      if (u) {
        return { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl };
      }
      const rawName = r.followerId.replace(/^usr_/, '');
      return {
        id: r.followerId,
        username: rawName,
        displayName: rawName.startsWith('v_') ? 'Spot Explorer' : rawName,
      };
    });
  }

  getUserFollowing(followerInput: string): Array<{ id: string; username: string; displayName: string; avatarUrl?: string }> {
    this.data.follows = this.data.follows || [];
    const followerId = this.normalizeUserKey(followerInput);
    const relations = this.data.follows.filter(
      f => (f.status === 'accepted' || !f.status) &&
        (f.followerId.toLowerCase() === followerId.toLowerCase() || f.followerId.toLowerCase() === followerInput.toLowerCase())
    );

    return relations.map(r => {
      const u = this.getUserById(r.followingId);
      if (u) {
        return { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl };
      }
      const rawName = r.followingId.replace(/^usr_/, '');
      return {
        id: r.followingId,
        username: rawName,
        displayName: rawName.startsWith('v_') ? 'Spot Explorer' : rawName,
      };
    });
  }

  getFollowCounts(userInput: string): { followersCount: number; followingCount: number } {
    this.data.follows = this.data.follows || [];
    const userKey = this.normalizeUserKey(userInput);
    const followersCount = this.data.follows.filter(
      f => (f.status === 'accepted' || !f.status) &&
        (f.followingId.toLowerCase() === userKey.toLowerCase() || f.followingId.toLowerCase() === userInput.toLowerCase())
    ).length;
    const followingCount = this.data.follows.filter(
      f => (f.status === 'accepted' || !f.status) &&
        (f.followerId.toLowerCase() === userKey.toLowerCase() || f.followerId.toLowerCase() === userInput.toLowerCase())
    ).length;
    return { followersCount, followingCount };
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

  deleteOrder(id: string): boolean {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    this.data.orders.splice(idx, 1);
    this.save();
    return true;
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

  // High-performance placement engine with spatial hash collision detection & concurrency reservation
  allocateCoordinate(
    width: number,
    height: number,
    autoReserve: boolean = false
  ): { x: number; y: number; rotation: number; reservationId?: string } {
    // Generous gap between spots: at least 38px of breathing room on all sides
    const PADDING = 38;

    // Spiral search outward starting from the center and expanding outward to find open pockets or frontier slots
    let angle = Math.random() * Math.PI * 2;
    let radius = 220;
    const stepAngle = 0.38;
    const stepRadius = 3.6;

    // Search up to radius ~16,000px
    for (let i = 0; i < 4500; i++) {
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      // Fast O(1) collision check against local spatial cells & active reservations
      if (!this.spatialIndex.checkCollision(x, y, width, height, PADDING)) {
        // Subtle organic rotation angle (-3.5 to +3.5 deg)
        const rotation = Math.round((Math.random() * 7 - 3.5) * 10) / 10;
        let reservationId: string | undefined;
        if (autoReserve) {
          reservationId = this.spatialIndex.reserveCoordinate(x, y, width, height);
        }
        return { x, y, rotation, reservationId };
      }

      angle += stepAngle;
      radius += stepRadius;
    }

    // Dynamic frontier placement: place outside the outermost spot extent with guaranteed gap
    const maxExtent = this.data.spots.reduce((max, s) => {
      if (s.status === 'hidden') return max;
      return Math.max(max, Math.hypot(s.x, s.y));
    }, 7500);

    let fallbackRadius = maxExtent + width + PADDING * 2;
    let fallbackAngle = Math.random() * Math.PI * 2;
    let fallbackX = Math.round(Math.cos(fallbackAngle) * fallbackRadius);
    let fallbackY = Math.round(Math.sin(fallbackAngle) * fallbackRadius);

    // Ensure fallback also has 0 collision
    while (this.spatialIndex.checkCollision(fallbackX, fallbackY, width, height, PADDING)) {
      fallbackRadius += PADDING * 2;
      fallbackAngle += 0.5;
      fallbackX = Math.round(Math.cos(fallbackAngle) * fallbackRadius);
      fallbackY = Math.round(Math.sin(fallbackAngle) * fallbackRadius);
    }

    const fallbackRot = Math.round((Math.random() * 6 - 3) * 10) / 10;
    let reservationId: string | undefined;
    if (autoReserve) {
      reservationId = this.spatialIndex.reserveCoordinate(fallbackX, fallbackY, width, height);
    }
    return {
      x: fallbackX,
      y: fallbackY,
      rotation: fallbackRot,
      reservationId,
    };
  }

  // =================== CONNECTED POPS & TAGGING ===================

  canUserConnectSpot(userKey: string, spot: Spot): boolean {
    if (!userKey || !spot) return false;
    const cleanUser = userKey.toLowerCase().replace(/^@/, '');

    // 1. Is user the owner of this spot?
    const isOwner =
      spot.ownerId?.toLowerCase() === cleanUser ||
      spot.ownerId?.toLowerCase() === `usr_${cleanUser}` ||
      spot.creatorName?.toLowerCase() === cleanUser;
    if (isOwner) return true;

    // 2. Is user tagged in this spot?
    const tags = [
      ...(spot.taggedUsers || []),
      ...(spot.content?.taggedUsers || []),
    ].map((t) => t.toLowerCase().replace(/^@/, ''));
    if (tags.includes(cleanUser)) return true;

    // 3. Does user follow the creator of this spot?
    const followsCreator =
      this.isUserFollowing(cleanUser, spot.creatorName) ||
      (spot.ownerId ? this.isUserFollowing(cleanUser, spot.ownerId) : false);
    if (followsCreator) return true;

    return false;
  }

  connectSpots(
    spotAId: string,
    spotBId: string,
    userKey?: string
  ): { success: boolean; error?: string; spotA?: Spot; spotB?: Spot } {
    if (spotAId === spotBId) {
      return { success: false, error: 'Cannot connect a Pop to itself' };
    }

    const spotA = this.getSpotByIdOrSlug(spotAId);
    const spotB = this.getSpotByIdOrSlug(spotBId);

    if (!spotA || !spotB) {
      return { success: false, error: 'One or both Pops were not found' };
    }

    // Permission check: user must be eligible to connect (own, tagged, or following)
    if (userKey) {
      const canA = this.canUserConnectSpot(userKey, spotA);
      const canB = this.canUserConnectSpot(userKey, spotB);
      if (!canA && !canB) {
        return {
          success: false,
          error:
            'You can only connect Pops that you created, are tagged in, or created by creators you follow.',
        };
      }
    }

    // Mutual bidirectional connection
    spotA.connectedSpotIds = Array.from(new Set([...(spotA.connectedSpotIds || []), spotB.id]));
    spotB.connectedSpotIds = Array.from(new Set([...(spotB.connectedSpotIds || []), spotA.id]));

    if (spotA.content) {
      spotA.content.connectedSpotIds = spotA.connectedSpotIds;
    }
    if (spotB.content) {
      spotB.content.connectedSpotIds = spotB.connectedSpotIds;
    }

    this.save();
    return { success: true, spotA, spotB };
  }

  disconnectSpots(
    spotAId: string,
    spotBId: string,
    userKey?: string
  ): { success: boolean; error?: string; spotA?: Spot; spotB?: Spot } {
    const spotA = this.getSpotByIdOrSlug(spotAId);
    const spotB = this.getSpotByIdOrSlug(spotBId);

    if (!spotA || !spotB) {
      return { success: false, error: 'One or both Pops were not found' };
    }

    if (userKey) {
      const canA = this.canUserConnectSpot(userKey, spotA);
      const canB = this.canUserConnectSpot(userKey, spotB);
      if (!canA && !canB) {
        return { success: false, error: 'Permission denied to disconnect these Pops' };
      }
    }

    spotA.connectedSpotIds = (spotA.connectedSpotIds || []).filter((id) => id !== spotB.id);
    spotB.connectedSpotIds = (spotB.connectedSpotIds || []).filter((id) => id !== spotA.id);

    if (spotA.content) {
      spotA.content.connectedSpotIds = spotA.connectedSpotIds;
    }
    if (spotB.content) {
      spotB.content.connectedSpotIds = spotB.connectedSpotIds;
    }

    this.save();
    return { success: true, spotA, spotB };
  }

  getConnectedSpots(spotId: string, viewerKey?: string): Spot[] {
    const spot = this.getSpotByIdOrSlug(spotId);
    if (!spot || !spot.connectedSpotIds || spot.connectedSpotIds.length === 0) {
      return [];
    }

    const connected = spot.connectedSpotIds
      .map((id) => this.getSpotByIdOrSlug(id))
      .filter((s): s is Spot => !!s && s.status === 'published' && s.moderationStatus === 'approved');

    // Apply visibility/privacy gating
    return connected.map((s) => {
      if (s.visibility === 'friends_only') {
        const isOwner =
          viewerKey &&
          (viewerKey.toLowerCase() === s.creatorName.toLowerCase() ||
            viewerKey.toLowerCase() === s.ownerId?.toLowerCase());
        if (isOwner) return { ...s, isLocked: false };
        const isFollowing = viewerKey ? this.isUserFollowing(viewerKey, s.creatorName) : false;
        return { ...s, isLocked: !isFollowing };
      }
      return s;
    });
  }

  getConnectableSpots(userKey: string, currentSpotId?: string): Spot[] {
    if (!userKey) return [];
    const all = this.data.spots.filter(
      (s) =>
        s.status === 'published' &&
        s.moderationStatus === 'approved' &&
        s.id !== currentSpotId
    );

    return all.filter((s) => this.canUserConnectSpot(userKey, s));
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
      onlineCount: Math.max(1, this.data.users.length), // Authentic active community members count
      claimedCount,
      spotsLeft,
      totalCapacity,
      miniPopCount,
      bigPopCount,
      totalRevenueINR: revenueINR,
    };
  }
}

export { Database };
export const db = new Database();
