export type ProductTier = 'mini_pop' | 'big_pop';

export interface ProductConfig {
  id: ProductTier;
  name: string;
  tagline: string;
  priceINR: number;
  pricePaise: number;
  width: number;
  height: number;
  features: string[];
  restrictions: string[];
}

export const PRODUCTS: Record<ProductTier, ProductConfig> = {
  mini_pop: {
    id: 'mini_pop',
    name: 'Mini Pop',
    tagline: 'A cute, affordable personal space',
    priceINR: 29,
    pricePaise: 2900,
    width: 180,
    height: 180,
    features: [
      'Sticky note or classic mini card',
      'Custom text & personal message',
      'Curated aesthetic fonts',
      'Colourful sticky & themed backgrounds',
      'Tape, pin & washi frame styles',
      'Free drag & corner resize stickers',
      'Instant permanent canvas spot',
      'Personal share kit & QR code',
    ],
    restrictions: [
      'No photo upload',
      'No freehand drawing pen',
      'Single card space',
    ],
  },
  big_pop: {
    id: 'big_pop',
    name: 'Big Pop',
    tagline: 'Larger, expressive photo & artwork canvas',
    priceINR: 99,
    pricePaise: 9900,
    width: 260,
    height: 320,
    features: [
      '2.5× larger canvas space',
      'Photo upload with free crop & zoom',
      'Polaroid, poster, sticker & frame shapes',
      'Draw anywhere across the full card space',
      '8 brush styles: Neon, Calligraphy, Spray, Watercolor & more',
      'Halloween, Christmas, Love & Galaxy themes',
      'Free drag, corner resize & opacity on every element',
      'HD viral social media share kit',
    ],
    restrictions: [],
  },
};

export type SpotShape =
  | 'sticky'
  | 'polaroid'
  | 'classic'
  | 'cutout'
  | 'poster'
  | 'graffiti'
  | 'transparent'
  | 'frameless'
  | 'glass'
  | 'gold'
  | 'comic'
  | 'holographic'
  | 'ticket'
  | 'stamp'
  | 'cyber';
export type FrameStyle = 'tape' | 'pin' | 'washi' | 'neon' | 'gold_crown' | 'film_strip' | 'cyber_glitch' | 'comic' | 'stamp' | 'duct_tape' | 'none';

export interface StickerItem {
  id: string;
  emojiOrIcon: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity?: number;
}

export type LayerType = 'image' | 'text' | 'shape' | 'sticker' | 'drawing';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface PhotoAdjustments {
  brightness?: number; // -100 to 100
  contrast?: number;   // -100 to 100
  saturation?: number; // -100 to 100
  exposure?: number;   // -100 to 100
  temperature?: number;// -100 to 100 (cool to warm)
  tint?: number;       // -100 to 100 (green to magenta)
  hue?: number;        // -180 to 180
  vignette?: number;   // 0 to 100
  grain?: number;      // 0 to 100
  blur?: number;       // 0 to 30
  sharpen?: number;    // 0 to 100
  filter?: 'none' | 'cinematic' | 'vintage' | 'retro' | 'noir' | 'cyberpunk' | 'pastel' | 'glitch' | 'sketch' | 'warm';
  flipH?: boolean;
  flipV?: boolean;
  retouchSmooth?: number; // 0 to 100
}

export interface SpotLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode?: BlendMode;
  zIndex?: number;
  // Image layer specific
  imageUrl?: string;
  adjustments?: PhotoAdjustments;
  photoAdjustments?: PhotoAdjustments;
  content?: string;
  // Text layer specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  textGradient?: string;
  letterSpacing?: number;
  lineHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  textGlow?: string | boolean;
  textStroke?: string;
  curved?: boolean;
  curveRadius?: number;
  bgBadgeColor?: string;
  alignment?: 'left' | 'center' | 'right';
  // Shape layer specific
  shapeType?: 'rectangle' | 'circle' | 'heart' | 'star' | 'speech_bubble' | 'arrow';
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  // Sticker layer specific
  emojiOrIcon?: string;
  // Drawing layer specific
  drawingData?: string;
}

export interface SpotContent {
  headline?: string;
  headlineX?: number;
  headlineY?: number;
  isCurvedText?: boolean;
  curveRadius?: number;
  textStroke?: string;
  textGlow?: string;
  letterSpacing?: number;
  text?: string;
  subtextX?: number;
  subtextY?: number;
  subtextSize?: number;
  author?: string;
  authorX?: number;
  authorY?: number;
  authorSize?: number;
  authorOpacity?: number;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  textOpacity?: number;
  alignment: 'left' | 'center' | 'right';
  imageUrl?: string;
  imageFit?: 'cover' | 'contain';
  photoOpacity?: number;
  photoZoom?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  photoAdjustments?: PhotoAdjustments;
  stickers: StickerItem[];
  layers?: SpotLayer[];
  drawingData?: string; // SVG path or stroke data
  drawingOpacity?: number;
  frameStyle: FrameStyle;
  badge?: string;
  tags?: string[];
}

export interface Spot {
  id: string;
  ownerId: string;
  creatorName: string;
  slug: string;
  tier: ProductTier;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: SpotShape;
  background: string;
  borderColor?: string;
  content: SpotContent;
  createdAt: string;
  status: 'published' | 'hidden' | 'unlisted';
  moderationStatus: 'approved' | 'flagged' | 'under_review' | 'removed';
  viewsCount: number;
  sharesCount: number;
  orderId?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: string;
  ownedSpotIds: string[];
}

export interface Order {
  id: string;
  userId: string;
  productId: ProductTier;
  amountINR: number;
  currency: 'INR';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  spotDraft: Partial<Spot>;
  allocatedSpotId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface ModerationReport {
  id: string;
  spotId: string;
  reporterEmail?: string;
  reason: 'inappropriate' | 'hate_speech' | 'harassment' | 'copyright' | 'spam' | 'other';
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedBy?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'claimed' | 'shared' | 'milestone';
  spotId?: string;
  creatorName: string;
  tier: ProductTier;
  message: string;
  timestamp: string;
}

export interface CanvasStats {
  onlineCount: number;
  claimedCount: number;
  spotsLeft: number;
  totalCapacity: number;
  miniPopCount: number;
  bigPopCount: number;
  totalRevenueINR: number;
}
