const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '..', 'server-db.json');

const URLS = [
  "https://picsum.photos/id/10/600/800.jpg",
  "https://picsum.photos/id/11/600/800.jpg",
  "https://picsum.photos/id/12/600/800.jpg",
  "https://picsum.photos/id/13/600/800.jpg",
  "https://picsum.photos/id/14/600/800.jpg",
  "https://picsum.photos/id/15/600/800.jpg",
  "https://picsum.photos/id/16/600/800.jpg",
  "https://picsum.photos/id/17/600/800.jpg",
  "https://picsum.photos/id/18/600/800.jpg",
  "https://picsum.photos/id/19/600/800.jpg",
  "https://picsum.photos/id/20/600/800.jpg",
  "https://picsum.photos/id/21/600/800.jpg",
  "https://picsum.photos/id/22/600/800.jpg",
  "https://picsum.photos/id/23/600/800.jpg",
  "https://picsum.photos/id/24/600/800.jpg",
  "https://picsum.photos/id/25/600/800.jpg",
  "https://picsum.photos/id/26/600/800.jpg",
  "https://picsum.photos/id/27/600/800.jpg",
  "https://picsum.photos/id/28/600/800.jpg",
  "https://picsum.photos/id/29/600/800.jpg",
  "https://picsum.photos/id/30/600/800.jpg",
  "https://picsum.photos/id/31/600/800.jpg",
  "https://picsum.photos/id/32/600/800.jpg",
  "https://picsum.photos/id/33/600/800.jpg",
  "https://picsum.photos/id/34/600/800.jpg",
  "https://picsum.photos/id/35/600/800.jpg",
  "https://picsum.photos/id/36/600/800.jpg",
  "https://picsum.photos/id/37/600/800.jpg",
  "https://picsum.photos/id/38/600/800.jpg",
  "https://picsum.photos/id/39/600/800.jpg",
  "https://picsum.photos/id/40/600/800.jpg",
  "https://picsum.photos/id/41/600/800.jpg",
  "https://picsum.photos/id/42/600/800.jpg",
  "https://picsum.photos/id/43/600/800.jpg",
  "https://picsum.photos/id/44/600/800.jpg",
  "https://picsum.photos/id/45/600/800.jpg",
  "https://picsum.photos/id/46/600/800.jpg",
  "https://picsum.photos/id/47/600/800.jpg",
  "https://picsum.photos/id/48/600/800.jpg",
  "https://picsum.photos/id/49/600/800.jpg",
  "https://picsum.photos/id/50/600/800.jpg",
  "https://picsum.photos/id/51/600/800.jpg",
  "https://picsum.photos/id/52/600/800.jpg",
  "https://picsum.photos/id/53/600/800.jpg",
  "https://picsum.photos/id/54/600/800.jpg",
  "https://picsum.photos/id/55/600/800.jpg",
  "https://picsum.photos/id/56/600/800.jpg",
  "https://picsum.photos/id/57/600/800.jpg",
  "https://picsum.photos/id/58/600/800.jpg",
  "https://picsum.photos/id/59/600/800.jpg",
  "https://picsum.photos/id/60/600/800.jpg",
  "https://picsum.photos/id/61/600/800.jpg",
  "https://picsum.photos/id/62/600/800.jpg",
  "https://picsum.photos/id/63/600/800.jpg",
  "https://picsum.photos/id/64/600/800.jpg",
  "https://picsum.photos/id/65/600/800.jpg",
  "https://picsum.photos/id/66/600/800.jpg",
  "https://picsum.photos/id/67/600/800.jpg",
  "https://picsum.photos/id/68/600/800.jpg",
  "https://picsum.photos/id/69/600/800.jpg",
  "https://convertico.com/samples/download.php?file=blue-and-bingo.gif&format=gif",
  "https://convertico.com/samples/download.php?file=blue-bandit-breakdancing.gif&format=gif",
  "https://convertico.com/samples/download.php?file=blue-dancing.gif&format=gif",
  "https://convertico.com/samples/download.php?file=blue-small.gif&format=gif",
  "https://convertico.com/samples/download.php?file=bugs-bunny-hd.gif&format=gif",
  "https://convertico.com/samples/download.php?file=bugs-bunny-hold-up-doc.gif&format=gif",
  "https://convertico.com/samples/download.php?file=caramela-got-the-moves.gif&format=gif",
  "https://convertico.com/samples/download.php?file=caramela-taking-notes.gif&format=gif",
  "https://convertico.com/samples/download.php?file=caramela-waving.gif&format=gif",
  "https://convertico.com/samples/download.php?file=convertico-bg-remover-sample.gif&format=gif",
  "https://convertico.com/samples/download.php?file=convertico-compress-gif-256-colors-gif.gif&format=gif",
  "https://convertico.com/samples/download.php?file=convertico-upscaler-sample.gif&format=gif",
  "https://convertico.com/samples/download.php?file=convertico-wooden-text-gif-256-colors.gif&format=gif",
  "https://convertico.com/samples/download.php?file=gif-sample.gif&format=gif",
  "https://convertico.com/samples/download.php?file=mesmerizing-motion-gif.gif&format=gif",
  "https://convertico.com/samples/download.php?file=sample-gif-animated-640x360-kitsune-ninja-zoom.gif&format=gif",
  "https://convertico.com/samples/download.php?file=sample-gif-animated-transparent-rooster.gif&format=gif",
  "https://convertico.com/samples/download.php?file=sample-gif-pixel-art-64x64-tree-frog.gif&format=gif",
  "https://convertico.com/samples/download.php?file=snoopy-dancing-gif.gif&format=gif",
  "https://convertico.com/samples/download.php?file=still-fishing-for-memes-easy-meme-generator.gif&format=gif",
  "https://convertico.com/samples/download.php?file=tom-and-jerry-garbage.gif&format=gif",
  "https://convertico.com/samples/download.php?file=tom-and-jerry-jerry.gif&format=gif",
  "https://convertico.com/samples/download.php?file=tom-and-jerry-nibbles.gif&format=gif",
  "https://testingfile.com/images/gif/sample-gif-bouncing-ball.gif",
  "https://testingfile.com/images/gif/sample-gif-loading-spinner.gif",
  "https://testingfile.com/images/gif/sample-gif-progress-bar.gif",
  "https://testingfile.com/images/gif/sample-gif-wave-chart.gif",
  "https://testingfile.com/images/gif/sample-gif-pulsing-rings.gif",
  "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/images/gif/sample-animated-320x180-small.gif",
  "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/images/gif/sample-animated-640x360-medium.gif",
  "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/images/gif/sample-animated-960x540-large.gif",
  "https://get-examplefiles.com/files/images/gif/example-10kb.gif",
  "https://get-examplefiles.com/files/images/gif/example-100kb.gif",
  "https://get-examplefiles.com/files/images/gif/example-500kb.gif",
  "https://get-examplefiles.com/files/images/gif/example-1mb.gif",
  "https://get-examplefiles.com/files/images/gif/example-5mb.gif",
  "https://get-examplefiles.com/files/images/gif/example-10mb.gif"
];

const CREATORS = [
  "Aarav", "Maya_Vibes", "Rohan_Art", "SnehaP", "PixelNomad", "Zenith", "KavyaK", "NeoTokio",
  "EchoSound", "WandererSam", "Ananya", "DevCraft", "Ishita", "ArjunV", "Riya", "Kabir",
  "Zoya_Lens", "Mira_C", "Aditya_K", "PoojaR", "Vikram_X", "Diya_Design", "TanyaS", "Reyansh",
  "Siddharth", "Tara_Flow", "Kunal_G", "Simran_B", "Aryan_99", "Nisha_Art"
];

const HEADLINES_PHOTO = [
  "Golden Hour Glow ✨", "Morning Fog 🌲", "Pacific Coast Waves 🌊", "Urban Reflections 🏙️",
  "Coffee & Quiet Thoughts ☕", "Desert Twilight 🏜️", "Alpine Peak ⛰️", "Neon Night Drive 🏮",
  "Autumn Whisper 🍂", "Coastal Sail ⛵", "Minimal Geometry 📐", "Midnight Highway 🛣️",
  "Secret Garden Sanctuary 🌿", "Starlit Vista 🌌", "Vintage Memories 📸", "Chasing Horizon 🌅",
  "Concrete Jungle Lines 🏢", "Canopy Sunbeams 🍃", "Old Town Heritage 🏰", "Monochrome Mood 🖤",
  "Wanderlust Spirit 🧭", "Serene Shoreline 🏖️", "Hidden Waterfall 💦", "Twilight Citylights 🌃",
  "Morning Espresso ☕", "Rolling Meadows 🌾", "Silent Valley 🏞️", "Retro Polaroid Vibes 🎞️",
  "Sun-Drenched Streets ☀️", "Deep Forest Trail 🌲", "Lakeside Reflection 🪞", "Canyon Shadows 🏜️",
  "Breeze on the Pier ⚓", "Misty Skyline 🌁", "Lavender Sunset 🌸", "Wildflower Field 🌼",
  "High Rise Rooftop 🏙️", "Subway Stories 🚇", "Cobblestone Romance 🕯️", "Northern Horizon ❄️",
  "Campfire Evenings 🔥", "Ocean Breeze 🐚", "Architectural Wonder 🏛️", "Sunset Silhouette 🌇",
  "Urban Exploration 🎒", "Golden Sand Dunes 🐫", "Peaceful Harbor ⛵", "Morning Dew 💧",
  "Skyline Vista 🌆", "Rustic Cabin 🪵", "Dreamy Blue 💙", "Warm Radiance ☀️",
  "Shadow & Light 🌗", "Endless Road 🛣️", "Cloud Kingdom ☁️", "Mountain Ridge 🏔️",
  "Sunset Coastline 🏖️", "Botanical Whispers 🌺", "Echoes of Time ⏳", "Living in Full Color 🎨"
];

const HEADLINES_GIF = {
  "blue-and-bingo": "Bluey & Bingo Groove 💃",
  "blue-bandit": "Bandit Breakdance King 🕺",
  "blue-dancing": "Bluey Dance Party 🎶",
  "blue-small": "Little Blue Steps 🐾",
  "bugs-bunny-hd": "Bugs Bunny Classic 🥕",
  "bugs-bunny-hold-up": "Hold Up Doc! 🛑",
  "caramela-got-the-moves": "Caramela Got The Moves 💃",
  "caramela-taking-notes": "Taking Quick Notes 📝",
  "caramela-waving": "Friendly Waves 👋",
  "convertico-bg-remover": "Cutout Magic In Motion ✨",
  "convertico-compress": "Retro 256 Color Vibes 🎨",
  "convertico-upscaler": "HD Upscale Energy ⚡",
  "convertico-wooden": "Wooden Carved Art 🪵",
  "gif-sample": "Classic Motion Sample 🎞️",
  "mesmerizing-motion": "Mesmerizing Motion 💫",
  "kitsune-ninja": "Kitsune Ninja Zoom 🦊",
  "transparent-rooster": "Morning Rooster 🐓",
  "tree-frog": "Pixel Tree Frog 🐸",
  "snoopy-dancing": "Snoopy Happy Dance 🐶",
  "fishing-for-memes": "Fishing For Memes 🎣",
  "tom-and-jerry-garbage": "Tom's Rough Day 😹",
  "tom-and-jerry-jerry": "Jerry's Quick Escape 🐭",
  "tom-and-jerry-nibbles": "Nibbles Snack Time 🧀",
  "bouncing-ball": "Bouncing Ball Physics 🏀",
  "loading-spinner": "Infinite Spin ⏳",
  "progress-bar": "Loading Up 📊",
  "wave-chart": "Soundwave Pulse 🌊",
  "pulsing-rings": "Pulsing Neon Rings 💫",
  "small": "Mini Animation Loop 🎬",
  "medium": "Medium Motion Frame 🎞️",
  "large": "High Def Sequence 📽️",
  "10kb": "Micro 10KB Artifact 💾",
  "100kb": "Retro 100KB Motion 👾",
  "500kb": "500KB Smooth Frame 🦄",
  "1mb": "1MB Animated Flow 🌈",
  "5mb": "High Frame Rate Motion 🚀",
  "10mb": "Ultimate 10MB Clip 🔥"
};

const SHAPES = ['polaroid', 'acrylic', 'comic', 'gold', 'holographic', 'ticket', 'stamp', 'cyber'];
const FRAMES = ['tape', 'pin', 'clip', 'neon', 'double_tape', 'stamp'];
const BACKGROUNDS = [
  '#FFFFFF', '#FFFDF0', '#FEF08A', '#0A0D14', '#1A1A24', '#F8FAFC',
  'linear-gradient(135deg, #FF2E93, #FF8A00)',
  'linear-gradient(135deg, #00F0FF, #7000FF)',
  'linear-gradient(135deg, #FF6A88, #FF99AC)',
  'linear-gradient(135deg, #F59E0B, #FDE68A)',
  'linear-gradient(135deg, #10B981, #064E3B)',
  'linear-gradient(135deg, #6366F1, #312E81)',
  'linear-gradient(135deg, #EC4899, #8B5CF6)'
];

const EMOJI_POOLS = ['✨', '💖', '🔥', '🌸', '⚡', '💫', '🎨', '🚀', '🌟', '💎', '🎉', '🍀', '🌈', '🦋', '🧸'];

function getHeadlineForUrl(url, idx) {
  for (const [key, title] of Object.entries(HEADLINES_GIF)) {
    if (url.toLowerCase().includes(key)) {
      return title;
    }
  }
  return HEADLINES_PHOTO[idx % HEADLINES_PHOTO.length];
}

// Generate organic 2D random scatter coordinates (NOT in a line or grid!)
function generateRandomScatterPositions(count, existingSpots) {
  const positions = [];
  const placed = existingSpots.map(s => ({ x: s.x, y: s.y }));

  // We scatter in an organic cluster across a wide circular/oval field
  // Radius from 120px to 2100px from center, with organic Poisson-like rejection
  const minDist = 155; // minimum distance between Pop centers to prevent total overlap
  const maxAttempts = 1500;

  for (let i = 0; i < count; i++) {
    let bestPos = null;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      // Random organic radius with Gaussian-like falloff
      const r = Math.pow(Math.random(), 0.65) * 1900 + 130;
      const angle = Math.random() * Math.PI * 2;
      const jitterX = (Math.random() - 0.5) * 80;
      const jitterY = (Math.random() - 0.5) * 80;

      const candX = Math.round(Math.cos(angle) * r + jitterX);
      const candY = Math.round(Math.sin(angle) * r + jitterY);

      // Check distance against all placed spots
      let tooClose = false;
      for (const p of placed) {
        const dx = candX - p.x;
        const dy = candY - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        bestPos = { x: candX, y: candY };
        break;
      }
    }

    // Fallback if field gets crowded
    if (!bestPos) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2000 + Math.random() * 400;
      bestPos = {
        x: Math.round(Math.cos(angle) * r),
        y: Math.round(Math.sin(angle) * r)
      };
    }

    placed.push(bestPos);
    positions.push(bestPos);
  }

  return positions;
}

function run() {
  const rawDb = fs.readFileSync(DB_FILE, 'utf-8');
  const db = JSON.parse(rawDb);
  db.spots = db.spots || [];

  console.log(`Initial spots in db: ${db.spots.length}`);

  const positions = generateRandomScatterPositions(URLS.length, db.spots);

  const newSpots = [];
  const now = Date.now();

  URLS.forEach((url, i) => {
    const creator = CREATORS[i % CREATORS.length];
    const headline = getHeadlineForUrl(url, i);
    const shape = SHAPES[i % SHAPES.length];
    const bg = shape === 'polaroid' ? '#FFFFFF' : BACKGROUNDS[i % BACKGROUNDS.length];
    const frame = FRAMES[i % FRAMES.length];
    const pos = positions[i];

    // Natural tilt (-5.5 deg to +5.5 deg)
    const rotation = parseFloat(((Math.random() * 11) - 5.5).toFixed(1));

    // Stagger timestamps across past 7 days
    const createdAgoMs = Math.floor(Math.random() * 7 * 24 * 3600 * 1000);
    const createdAt = new Date(now - createdAgoMs).toISOString();

    const views = Math.floor(Math.random() * 3800) + 75;
    const likes = Math.floor(views * (0.15 + Math.random() * 0.25));
    const shares = Math.floor(likes * (0.1 + Math.random() * 0.2));

    // 10% of pops are friends_only to showcase following unlock
    const isFriendsOnly = i % 10 === 7;
    const visibility = isFriendsOnly ? 'friends_only' : 'public';

    // 1-2 random stickers
    const stickers = [];
    const numStickers = Math.floor(Math.random() * 2) + 1;
    for (let s = 0; s < numStickers; s++) {
      stickers.push({
        id: `stk_${now}_${i}_${s}`,
        emojiOrIcon: EMOJI_POOLS[Math.floor(Math.random() * EMOJI_POOLS.length)],
        x: Math.floor(Math.random() * 100) + 30,
        y: Math.floor(Math.random() * 130) + 20,
        size: Math.floor(Math.random() * 16) + 24,
        rotation: Math.floor((Math.random() - 0.5) * 30),
        opacity: 0.95
      });
    }

    const slug = `${headline.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-${Math.random().toString(36).substr(2, 4)}`;

    const spot = {
      id: `sp_test_${now}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      ownerId: `usr_${creator.toLowerCase()}`,
      creatorName: creator,
      slug,
      tier: 'big_pop',
      x: pos.x,
      y: pos.y,
      width: 170,
      height: 210,
      rotation,
      shape,
      background: bg,
      visibility,
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: views,
      likesCount: likes,
      sharesCount: shares,
      allowComments: true,
      commentsCount: Math.floor(Math.random() * 8),
      createdAt,
      content: {
        headline,
        text: `Captured by @${creator} ✨`,
        author: creator,
        imageUrl: url,
        imageFit: 'cover',
        textColor: bg === '#0A0D14' || bg === '#1A1A24' ? '#FFFFFF' : '#0F172A',
        fontFamily: 'Caveat',
        fontSize: 22,
        alignment: 'center',
        frameStyle: frame,
        stickers,
        photoOpacity: 1,
        photoZoom: 1,
        photoOffsetX: 0,
        photoOffsetY: 0,
        layers: [],
        photoAdjustments: {
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
          effect: 'none'
        }
      }
    };

    newSpots.push(spot);
  });

  db.spots = [...db.spots, ...newSpots];

  // Update total stats in settings
  db.systemSettings = db.systemSettings || {};
  db.systemSettings.initialOffsetClaims = (db.systemSettings.initialOffsetClaims || 234700) + newSpots.length;

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Successfully added ${newSpots.length} Big Pops! Total spots now: ${db.spots.length}`);

  // Print sample coordinates to confirm non-line-by-line distribution
  console.log('\nSample random coordinates (first 8 spots):');
  newSpots.slice(0, 8).forEach((s, idx) => {
    console.log(`[${idx+1}] (${s.x}, ${s.y}) rot: ${s.rotation}° | "${s.content.headline}" by @${s.creatorName} [${s.shape}]`);
  });
}

run();
