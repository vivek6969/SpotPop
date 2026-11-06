const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '..', 'server-db.json');

const PASTEL_COLORS = [
  '#FEF08A', '#FF80BF', '#BAE6FD', '#BBF7D0', '#DDD6FE',
  '#FED7AA', '#FBCFE8', '#C7D2FE', '#FDE68A', '#E9D5FF',
  '#A7F3D0', '#FECDD3', '#F5D0FE', '#E0E7FF', '#FEF9C3'
];

const FONTS = [
  'Caveat', 'Permanent Marker', 'Gloria Hallelujah', 'Kalam',
  'Pacifico', 'Outfit', 'Shadows Into Light', 'Satisfy',
  'Sacramento', 'Comfortaa', 'Bangers', 'Fredoka'
];

const STICKERS = [
  '✨', '💖', '☕', '🚀', '🍕', '🌸', '🔥', '🐶', '🐱', '🥑',
  '🌈', '⭐', '🎨', '📸', '⚡', '🍀', '🧁', '🌻', '🎵', '🏖️',
  '🍩', '🎧', '🍓', '🧸', '💡', '🌙', '🌊', '🪴', '🍿', '🎈'
];

const CREATORS = [
  'Vivek', 'Riya & Kabir', 'Sarah Lin', 'Alex Chen', 'Maya Patel',
  'Liam Ross', 'Emily White', 'David Kim', 'Chloe Martin', 'Arjun Verma',
  'Zara Noor', 'Leo Tanaka', 'Sofia Rossi', 'Rohan & Tanya', 'Jordan Bell',
  'Nina Shah', 'Daniel Roy', 'Lucas Grey', 'Mia Flores', 'Aisha Khan',
  'Noah Green', 'Oliver Ward', 'Kai & Ava', 'Elena Silva', 'Ethan Hunt',
  'Hannah Baker', 'Priya Sharma', 'Marcus Vance', 'Stella Blue', 'Samira Reed',
  'Felix Brooks', 'Nora Jensen', 'Tariq Malik', 'Ananya Sen', 'Caleb Foster',
  'Zoe Kravitz', 'Devon Miles', 'Amara Cole', 'Vikram Seth', 'Isla Stewart',
  'Aarav Kapoor', 'Meera Joshi', 'Devansh Roy', 'Sneha Pillai', 'Aditya Nair',
  'Tanvi Deshmukh', 'Kabir Bedi', 'Anika Gupta', 'Rishi Menon', 'Tara Singhania'
];

const MINI_HEADLINES = [
  'Good Vibes Only ♡', 'Late Night Coder', 'Coffee First ☕', 'Stay Curious',
  'Be Kind Always', "Dreams Don't Sleep", 'Blink and you miss', 'Keep smiling :)',
  'Wild & Free', 'Music is Life', 'Peace & Calm', 'Code All Night',
  'Love You 3000', 'Just Keep Swimming', 'Art is Rebellion', 'Catch Me Outside',
  'Create Every Day', 'Manifesting Greatness', 'Little Joys', 'Sun-kissed',
  "Don't Quit", 'Forever Exploring', 'Making Memories', 'One Day at a Time',
  'Chasing Sunsets', 'Kindness is Free', 'Never Stop Dreaming', 'Breathe In Deep',
  'Self Care Sunday', 'Gotta Catch Em All', 'Forever Young', 'Do Epic Shit'
];

const MINI_QUOTES = [
  'Living life in full color.', 'Small steps every single day.', 'Happiness is homemade.',
  'Collecting moments, not things.', 'Everything happens for a reason.', 'Keep going, you got this.',
  'Radiate good energy.', 'Find beauty in simple things.', 'Leave a little sparkle wherever you go.',
  'Stay patient and trust your journey.', 'Fueled by iced coffee and curiosity.',
  'Making the internet a friendlier place.', 'Building the future one line of code at a time.'
];

const PHOTO_IDS = [
  'photo-1507525428034-b723cf961d3e', // Beach sunset
  'photo-1518791841217-8f162f1e1131', // Cat
  'photo-1534528741775-53994a69daeb', // Portrait
  'photo-1543466835-00a7907e9de1', // Dog
  'photo-1501785888041-af3ef285b470', // Landscape
  'photo-1492684223066-81342ee5ff30', // Concert
  'photo-1517841905240-472988babdf9', // Neon portrait
  'photo-1470071459604-3b5ec3a7fe05', // Misty mountain
  'photo-1514888286974-6c03e2ca1dba', // Cute cat
  'photo-1555685812-4b943f1cb0eb', // Puppy
  'photo-1495474472287-4d71bcdd2085', // Coffee art
  'photo-1519741497674-611481863552', // Wedding love
  'photo-1526778548025-fa2f459cd5c1', // Travel backpack
  'photo-1506744038136-46273834b3fb', // Yosemite
  'photo-1493976040374-85c8e12f0c0e', // Kyoto Japan
  'photo-1524758631624-e2822e304c36', // Interior cozy
  'photo-1513694203232-719a280e022f', // Neon room
  'photo-1469474968028-56623f02e42e', // Forest woman
  'photo-1509198397868-475647b2a1e5', // Gaming setup
  'photo-1497215728101-856f4ea42174', // Modern office
  'photo-1501386761578-eac5c94b800a', // Festival lights
  'photo-1511671782779-c97d3d27a1d4', // Vinyl turntable
  'photo-1535713875002-d1d0cf377fde', // Minimal portrait
  'photo-1546069901-ba9599a7e63c', // Fresh salad food
  'photo-1565299624946-b28f40a0ae38', // Pizza slice
  'photo-1496181133206-80ce9b88a853', // Laptop desk
  'photo-1488590528505-98d2b5aba04b', // Coding code
  'photo-1500485035595-cbe6f645feb1', // Lake mirror
  'photo-1531746020798-e6953c6e8e04', // Retro portrait
  'photo-1483985988355-763728e1935b'  // Fashion street
];

const BIG_HEADLINES = [
  'Forever Dusk ♡', 'Ocean Power', 'Sunset Memories', 'Tokyo Drift',
  'Golden Hour', 'Cozy Mornings', 'Puppy Love', 'Cat Kingdom',
  'Mountain Escape', 'Festival Night', 'Chasing Horizons', 'Coffee & Code',
  'Lost in Kyoto', 'Analog Dreams', 'Wanderlust 2026', 'Street Symphony',
  'Desert Solitude', 'Electric Avenue', 'Wild at Heart', 'Starry Canvas'
];

function generateOrganicPositions(count) {
  const positions = [];
  const R = 55;
  const BASE_X = 225;
  const BASE_Y = 235;

  for (let r = -R; r <= R; r++) {
    for (let c = -R; c <= R; c++) {
      // 16% random dropouts to create natural medium-spaced pockets between clusters
      if (Math.random() < 0.16) continue;

      // Organic cluster jitter:
      // When spots drift toward each other they kiss/touch;
      // when they drift slightly apart they leave small (15-35px) or medium (40-75px) spaces!
      const jitterX = (Math.random() - 0.5) * 85;
      const jitterY = (Math.random() - 0.5) * 85;
      const x = Math.round(c * BASE_X + (Math.abs(r) % 2) * (BASE_X / 2) + jitterX);
      const y = Math.round(r * BASE_Y + jitterY);

      // Reserve space around Origin hero spot (290x140 at 0,0)
      if (Math.abs(x) < 220 && Math.abs(y) < 140) continue;

      const distSq = x * x + y * y;
      positions.push({ x, y, distSq });
    }
  }

  // Sort by distance from origin to form a cohesive organic cluster
  positions.sort((a, b) => a.distSq - b.distSq);
  return positions.slice(0, count);
}

function generateAllSpots() {
  const spots = [];

  // 1. Origin Hero Spot in Center
  spots.push({
    id: 'sp_spotpop_hero',
    ownerId: 'usr_admin',
    creatorName: 'SpotPop Team',
    slug: 'spotpop-origin',
    tier: 'big_pop',
    x: 0,
    y: 0,
    width: 290,
    height: 140,
    rotation: -1.5,
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
        { id: 'stk_2', emojiOrIcon: '✨', x: 245, y: 85, size: 24, rotation: 15 }
      ],
      frameStyle: 'neon',
      badge: 'ORIGIN'
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 18450,
    sharesCount: 4210
  });

  // 2. Generate 2,000 Small Pops + 2,000 Big Pops (Total 4,000 spots)
  const TOTAL_DEMO = 4000;
  const positions = generateOrganicPositions(TOTAL_DEMO);

  let smallCount = 0;
  let bigCount = 0;

  for (let i = 0; i < TOTAL_DEMO; i++) {
    const isBig = i % 2 === 0; // alternating: 2000 small, 2000 big
    const tier = isBig ? 'big_pop' : 'mini_pop';
    const id = isBig ? `sp_big_${++bigCount}` : `sp_mini_${++smallCount}`;

    const pos = positions[i];
    const x = pos.x;
    const y = pos.y;

    // Organic rotation: -4.5 to +4.5 degrees for authentic collage feel
    const rotation = Math.round((Math.random() * 9 - 4.5) * 10) / 10;

    const creator = CREATORS[i % CREATORS.length];
    const username = creator.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const slug = `${username}-${Math.random().toString(36).substring(2, 6)}`;
    const randomDaysAgo = Math.floor(Math.random() * 25);
    const createdAt = new Date(Date.now() - randomDaysAgo * 86400000 - Math.random() * 86400000).toISOString();
    const viewsCount = Math.floor(Math.random() * 3200) + 15;
    const sharesCount = Math.floor(viewsCount * (0.15 + Math.random() * 0.25));

    if (isBig) {
      // Big Pop: photo, polaroid or poster
      const photoId = PHOTO_IDS[(i * 3) % PHOTO_IDS.length];
      const imageUrl = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&q=75`;
      const headline = BIG_HEADLINES[i % BIG_HEADLINES.length];
      const sticker = STICKERS[(i * 7) % STICKERS.length];
      const frameStyles = ['tape', 'pin', 'film_strip', 'neon', 'washi'];
      const frameStyle = frameStyles[i % frameStyles.length];
      const shape = i % 3 === 0 ? 'polaroid' : i % 5 === 0 ? 'poster' : 'classic';

      // Attach audio memory to select Big Pops
      const hasAudio = i === 0 || i % 18 === 0;
      const audioObj = hasAudio ? {
        url: '/uploads/audio/demo_sunset_chimes.wav',
        storageKey: 'demo_sunset_chimes.wav',
        duration: 8.0,
        mimeType: 'audio/wav',
        size: 352844,
        type: i % 2 === 0 ? 'music' : 'voice'
      } : undefined;

      spots.push({
        id,
        ownerId: `usr_${username}`,
        creatorName: creator,
        slug,
        tier: 'big_pop',
        x,
        y,
        width: 170,
        height: 210,
        rotation,
        shape,
        background: shape === 'polaroid' ? '#FFFFFF' : '#12141F',
        content: {
          headline,
          text: `Captured by ${creator}`,
          author: creator,
          textColor: shape === 'polaroid' ? '#1E293B' : '#FFFFFF',
          fontFamily: FONTS[(i * 2) % FONTS.length],
          fontSize: 22,
          alignment: 'center',
          imageUrl,
          imageFit: 'cover',
          stickers: [
            {
              id: `stk_${id}_1`,
              emojiOrIcon: sticker,
              x: 135,
              y: 20,
              size: 22,
              rotation: Math.round((Math.random() * 20 - 10))
            }
          ],
          frameStyle,
          audio: audioObj
        },
        createdAt,
        status: 'published',
        moderationStatus: 'approved',
        viewsCount,
        sharesCount
      });
    } else {
      // Mini Pop: Colorful sticky note with quote & stickers
      const bg = PASTEL_COLORS[i % PASTEL_COLORS.length];
      const headline = MINI_HEADLINES[i % MINI_HEADLINES.length];
      const quote = MINI_QUOTES[(i * 3) % MINI_QUOTES.length];
      const sticker = STICKERS[(i * 5) % STICKERS.length];
      const frameStyles = ['pin', 'tape', 'stamp', 'washi'];
      const frameStyle = frameStyles[i % frameStyles.length];

      spots.push({
        id,
        ownerId: `usr_${username}`,
        creatorName: creator,
        slug,
        tier: 'mini_pop',
        x,
        y,
        width: 170,
        height: 170,
        rotation,
        shape: 'sticky',
        background: bg,
        content: {
          headline,
          text: quote,
          author: creator,
          textColor: '#1E293B',
          fontFamily: FONTS[(i * 3) % FONTS.length],
          fontSize: 24,
          alignment: 'center',
          stickers: [
            {
              id: `stk_${id}_1`,
              emojiOrIcon: sticker,
              x: 135,
              y: 22,
              size: 22,
              rotation: Math.round((Math.random() * 20 - 10))
            }
          ],
          frameStyle
        },
        createdAt,
        status: 'published',
        moderationStatus: 'approved',
        viewsCount,
        sharesCount
      });
    }
  }

  return { spots, smallCount, bigCount };
}

function main() {
  console.log('Generating 2,000 Small Pops + 2,000 Big Pops with organic staggered placement...');
  const { spots, smallCount, bigCount } = generateAllSpots();

  // Read existing DB to preserve users, orders, and stats structure
  let existingDb = { users: [], orders: [], stats: {}, spots: [] };
  if (fs.existsSync(DB_FILE)) {
    try {
      existingDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Could not read existing DB, resetting cleanly');
    }
  }

  // Backup current database safely
  const backupFile = path.resolve(__dirname, '..', 'server-db.backup.json');
  fs.copyFileSync(DB_FILE, backupFile);
  console.log(`Backed up previous database to ${backupFile}`);

  // Update spots and stats
  existingDb.spots = spots;
  existingDb.stats = {
    onlineCount: 2540,
    claimedCount: 236701 + spots.length,
    spotsLeft: 63299,
    totalCapacity: 300000,
    miniPopCount: smallCount,
    bigPopCount: bigCount + 1,
    totalRevenueINR: smallCount * 29 + bigCount * 99
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(existingDb, null, 2), 'utf-8');
  console.log(`Success! Created ${spots.length} spots (${smallCount} Mini Pops + ${bigCount} Big Pops + 1 Hero).`);
}

main();
