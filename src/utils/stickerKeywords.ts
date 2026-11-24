/**
 * Comprehensive Emoji & Sticker Search Keywords Dictionary
 * Maps every emoji, phrase, and badge to semantic English search terms.
 */

export const EMOJI_KEYWORD_MAP: Record<string, string[]> = {
  // Love & Romance
  '♡': ['heart', 'love', 'white heart', 'outline heart', 'shape', 'romance', 'cute', 'like'],
  '💖': ['heart', 'sparkling heart', 'love', 'pink', 'sparkle', 'shine', 'glow', 'crush', 'glitter'],
  '💕': ['heart', 'two hearts', 'love', 'pink', 'double heart', 'affection', 'romance'],
  '💘': ['heart', 'arrow', 'cupid', 'love', 'valentine', 'shot', 'target', 'romance'],
  '💝': ['heart', 'ribbon', 'gift', 'love', 'present', 'box', 'valentine', 'pink'],
  '💌': ['love letter', 'mail', 'envelope', 'letter', 'heart', 'post', 'message', 'note'],
  '🌹': ['rose', 'flower', 'red rose', 'love', 'romance', 'plant', 'petal', 'valentines'],
  '🥀': ['wilted rose', 'rose', 'flower', 'sad', 'heartbreak', 'broken', 'dead flower'],
  '💍': ['ring', 'diamond', 'wedding', 'proposal', 'marry', 'engagement', 'gold', 'jewelry'],
  '👩‍❤️‍👨': ['couple', 'love', 'kiss', 'relationship', 'man woman', 'together', 'dating'],
  '💋': ['kiss', 'lips', 'love', 'romance', 'lipstick', 'mouth', 'muah', 'sexy'],
  '🧸': ['teddy bear', 'bear', 'toy', 'cute', 'hug', 'soft', 'stuffed animal', 'plushie'],
  '🕊️': ['dove', 'bird', 'peace', 'white bird', 'freedom', 'fly', 'holy'],
  '🥂': ['clinking glasses', 'cheers', 'champagne', 'toast', 'celebrate', 'drink', 'party', 'alcohol', 'wine'],
  '🍓': ['strawberry', 'fruit', 'berry', 'sweet', 'food', 'red', 'snack'],
  '🎀': ['ribbon', 'pink ribbon', 'bow', 'cute', 'coquette', 'decor', 'present'],
  '✨': ['sparkles', 'stars', 'magic', 'shine', 'glow', 'glitter', 'clean', 'special', 'aesthetic'],
  '🫀': ['anatomical heart', 'heart', 'organ', 'real heart', 'biology', 'love', 'red'],
  '🏹': ['bow and arrow', 'cupid', 'arrow', 'shoot', 'archery', 'weapon', 'love'],
  '🫶': ['heart hands', 'love', 'hands', 'hand heart', 'support', 'appreciate', 'gesture'],
  '😻': ['cat', 'heart eyes', 'smiling cat', 'love', 'kitty', 'kitten', 'cute', 'pet'],
  '💐': ['bouquet', 'flowers', 'love', 'gift', 'blossom', 'present', 'anniversary'],
  '🍫': ['chocolate', 'candy', 'sweet', 'bar', 'food', 'snack', 'dessert', 'cocoa'],
  '🎂': ['birthday cake', 'cake', 'celebrate', 'party', 'sweet', 'bday', 'candles', 'dessert'],
  '💑': ['couple', 'love', 'dating', 'relationship', 'partners'],
  '❤️‍🔥': ['heart on fire', 'fire heart', 'passion', 'love', 'burning heart', 'hot', 'flame', 'lit'],
  '🥰': ['smiling face with hearts', 'love', 'happy', 'crush', 'in love', 'hearts', 'warm', 'blushing'],
  '😘': ['face blowing a kiss', 'kiss', 'love', 'blow kiss', 'heart kiss', 'romance'],
  '💒': ['wedding', 'church', 'marriage', 'chapel', 'bride', 'groom', 'venue'],
  '🌸': ['cherry blossom', 'flower', 'sakura', 'pink flower', 'spring', 'floral', 'japanese'],

  // Halloween & Spooky
  '🎃': ['jack-o-lantern', 'pumpkin', 'halloween', 'spooky', 'autumn', 'orange', 'creepy'],
  '👻': ['ghost', 'spooky', 'boo', 'halloween', 'spirit', 'white ghost', 'scary', 'haunted'],
  '🦇': ['bat', 'vampire', 'halloween', 'night', 'animal', 'flying', 'spooky'],
  '🕷️': ['spider', 'bug', 'halloween', 'creepy', 'arachnid', 'insect', 'scary'],
  '🕸️': ['spider web', 'web', 'halloween', 'cobweb', 'trap', 'spooky'],
  '💀': ['skull', 'dead', 'skeleton', 'death', 'halloween', 'danger', 'bones', 'head', 'poison'],
  '🧛': ['vampire', 'dracula', 'blood', 'halloween', 'monster', 'fangs', 'creepy'],
  '🧙': ['wizard', 'witch', 'magic', 'halloween', 'spell', 'mage', 'sorcerer'],
  '🔮': ['crystal ball', 'magic', 'fortune', 'witch', 'psychic', 'purple', 'future'],
  '🐈‍⬛': ['black cat', 'cat', 'witch', 'bad luck', 'halloween', 'kitty', 'dark'],
  '🍬': ['candy', 'sweet', 'treat', 'trick or treat', 'sugar', 'snack'],
  '🩸': ['drop of blood', 'blood', 'bleed', 'red', 'halloween', 'gore', 'vampire'],
  '🕯️': ['candle', 'flame', 'light', 'wax', 'fire', 'dark', 'cozy', 'spooky'],
  '🌙': ['crescent moon', 'moon', 'night', 'sleep', 'dark', 'lunar', 'sky'],
  '⚰️': ['coffin', 'grave', 'death', 'funeral', 'rip', 'casket', 'spooky', 'halloween'],
  '🧟': ['zombie', 'undead', 'monster', 'walking dead', 'apocalypse', 'halloween'],
  '⚡': ['lightning', 'bolt', 'electric', 'thunder', 'power', 'energy', 'zap', 'flash', 'yellow'],
  '🦉': ['owl', 'bird', 'night', 'wise', 'nocturnal', 'animal'],
  '🍁': ['maple leaf', 'autumn', 'fall', 'orange leaf', 'canada', 'nature', 'tree'],

  // Christmas & Holiday
  '🎄': ['christmas tree', 'xmas', 'tree', 'holiday', 'pine', 'december', 'green'],
  '🎅': ['santa', 'santa claus', 'father christmas', 'xmas', 'holiday', 'gifts', 'beard', 'red'],
  '❄️': ['snowflake', 'snow', 'cold', 'winter', 'ice', 'frozen', 'white', 'december'],
  '⛄': ['snowman', 'winter', 'snow', 'cold', 'frosty', 'december', 'carrot'],
  '🎁': ['gift', 'present', 'box', 'birthday', 'christmas', 'package', 'surprise', 'wrap'],
  '🦌': ['deer', 'reindeer', 'rudolph', 'animal', 'forest', 'christmas', 'horns', 'antlers'],
  '🔔': ['bell', 'jingle bell', 'chime', 'ring', 'gold bell', 'sound', 'alert'],
  '🍪': ['cookie', 'biscuit', 'chocolate chip', 'snack', 'sweet', 'bakery', 'food'],
  '🥛': ['glass of milk', 'milk', 'drink', 'beverage', 'calcium', 'dairy'],
  '🧦': ['socks', 'stocking', 'christmas stocking', 'warm', 'clothes', 'feet'],
  '🧣': ['scarf', 'winter', 'warm', 'clothes', 'neck', 'cold'],
  '🧤': ['gloves', 'mittens', 'winter', 'cold', 'hands', 'warm'],
  '⭐': ['star', 'yellow star', 'gold star', 'shine', 'night', 'favorite', 'rating', 'winner'],
  '☕': ['coffee', 'hot drink', 'tea', 'cafe', 'mug', 'cup', 'espresso', 'cappuccino', 'morning'],
  '🌲': ['evergreen tree', 'tree', 'pine', 'nature', 'forest', 'christmas', 'green', 'wood'],
  '🛷': ['sled', 'sleigh', 'snow', 'winter', 'ride', 'santa'],
  '🌟': ['glowing star', 'star', 'sparkle', 'shine', 'glow', 'gold', 'yellow'],
  '🎉': ['party popper', 'celebrate', 'congrats', 'confetti', 'party', 'tada', 'congratulations', 'fun'],

  // Memes & Cool
  '😎': ['smiling face with sunglasses', 'cool', 'sunglasses', 'swag', 'chill', 'boss', 'awesome'],
  '🕶️': ['sunglasses', 'glasses', 'dark', 'cool', 'eyewear', 'shades'],
  '🐸': ['frog', 'pepe', 'meme', 'toad', 'green', 'animal', 'amphibian'],
  '🐶': ['dog', 'puppy', 'dog face', 'pet', 'cute dog', 'canine', 'animal', 'woof'],
  '🚀': ['rocket', 'space', 'to the moon', 'launch', 'fast', 'blast', 'ship', 'crypto', 'growth'],
  '🔥': ['fire', 'flame', 'hot', 'lit', 'trending', 'burn', 'warm', 'streak'],
  '💯': ['100', 'hundred', 'score', 'perfect', 'keep it 100', 'real', 'exam', 'full'],
  '👑': ['crown', 'king', 'queen', 'royalty', 'gold crown', 'winner', 'leader', 'prince', 'princess'],
  '💎': ['gem', 'diamond', 'jewel', 'crystal', 'precious', 'shine', 'rich', 'blue'],
  '🍕': ['pizza', 'food', 'cheese', 'slice', 'italian', 'snack', 'dinner', 'pepperoni'],
  '🍿': ['popcorn', 'movie', 'snack', 'cinema', 'film', 'food', 'corn'],
  '💣': ['bomb', 'boom', 'explosion', 'blast', 'danger', 'wick'],
  '🧢': ['billed cap', 'cap', 'hat', 'no cap', 'blue cap', 'baseball', 'clothes'],
  '🛹': ['skateboard', 'skate', 'skater', 'board', 'ollie', 'street'],
  '🛸': ['ufo', 'flying saucer', 'alien', 'space', 'extraterrestrial', 'sci-fi'],
  '🎯': ['bullseye', 'direct hit', 'target', 'dart', 'focus', 'goal', 'aim', 'game'],
  '🎸': ['guitar', 'music', 'rock', 'instrument', 'acoustic', 'electric', 'song', 'play'],
  '💰': ['money bag', 'money', 'rich', 'cash', 'dollar', 'wealth', 'bag', 'crypto', 'gold'],

  // Anime & Gaming
  '🎮': ['video game', 'game controller', 'gaming', 'play', 'playstation', 'xbox', 'nintendo', 'pad'],
  '🕹️': ['joystick', 'arcade', 'retro gaming', 'controller', '80s', 'classic'],
  '👾': ['alien monster', 'space invader', 'pixel', 'retro game', '8-bit', 'game', 'enemy'],
  '🍥': ['fish cake', 'naruto', 'ramen', 'swirl', 'anime', 'japan', 'pink'],
  '🎧': ['headphones', 'music', 'listen', 'headset', 'audio', 'gamer', 'earphones', 'beats'],
  '⚔️': ['crossed swords', 'swords', 'fight', 'battle', 'weapon', 'rpg', 'pvp', 'warrior'],
  '🪐': ['ringed planet', 'saturn', 'space', 'galaxy', 'planet', 'universe', 'orbit', 'astronomy'],
  '🏆': ['trophy', 'winner', 'first place', 'champion', 'gold cup', 'award', 'victory'],
  '🥋': ['martial arts', 'karate', 'judo', 'gi', 'fight', 'belt', 'dojo'],
  '💥': ['collision', 'boom', 'pow', 'explode', 'blast', 'comic', 'action', 'hit'],
  '🍜': ['steaming bowl', 'ramen', 'noodles', 'soup', 'japanese', 'chopsticks', 'food'],
  '🎋': ['tanabata tree', 'bamboo', 'wish', 'japan', 'festival', 'green', 'plant'],
  '🍙': ['rice ball', 'onigiri', 'japanese food', 'rice', 'seaweed', 'snack'],
  '🍣': ['sushi', 'fish', 'japanese food', 'sashimi', 'seafood'],
  '🌌': ['milky way', 'galaxy', 'stars', 'space', 'nebula', 'night sky', 'universe'],
  '🤖': ['robot', 'bot', 'android', 'ai', 'cyborg', 'machine', 'tech', 'future'],
  '🦊': ['fox', 'fox face', 'kitsune', 'animal', 'cute', 'orange', 'clever'],
  '🐉': ['dragon', 'mythical', 'monster', 'asian dragon', 'serpent', 'legend', 'fantasy'],

  // Signs & Doodles
  '✌️': ['peace sign', 'victory', 'two', 'hand', 'peace', 'v sign', 'fingers'],
  '☀️': ['sun', 'sunny', 'sunshine', 'warm', 'summer', 'day', 'bright', 'yellow', 'solar'],
  '🌊': ['water wave', 'ocean', 'sea', 'surf', 'tsunami', 'beach', 'blue', 'water'],
  '🌿': ['herb', 'plant', 'leaves', 'greenery', 'nature', 'foliage', 'organic'],
  '🎨': ['artist palette', 'art', 'paint', 'colors', 'creative', 'design', 'drawing'],
  '🎵': ['musical note', 'music', 'tune', 'song', 'sound', 'melody'],
  '🍀': ['four leaf clover', 'clover', 'luck', 'lucky', 'green', 'irish', 'st patricks'],
  '💡': ['light bulb', 'idea', 'bright', 'smart', 'light', 'electric', 'innovation'],
  '📌': ['pushpin', 'pin', 'note', 'board', 'marker', 'red pin', 'attach'],
  '⚓': ['anchor', 'ship', 'sailor', 'nautical', 'sea', 'boat', 'ocean'],
  '🔑': ['key', 'unlock', 'secret', 'gold key', 'access', 'door', 'password'],
  '🏷️': ['label', 'tag', 'price tag', 'ticket', 'sale', 'badge'],
  '🪄': ['magic wand', 'wand', 'magic', 'wizard', 'fairy', 'sparkle'],
  '🪶': ['feather', 'quill', 'bird', 'light', 'wing', 'soft', 'pen'],
  '🪞': ['mirror', 'reflection', 'glass', 'vanity', 'beauty'],
  '🧁': ['cupcake', 'cake', 'sweet', 'bakery', 'frosting', 'sprinkles', 'dessert'],
  '🍩': ['doughnut', 'donut', 'sweet', 'snack', 'sprinkles', 'bakery', 'food'],

  // Romantic Quotes & Stamps
  'Forever ♡': ['forever', 'love', 'heart', 'quote', 'stamp', 'romance', 'always', 'infinity'],
  'My Person': ['my person', 'love', 'best friend', 'quote', 'soulmate', 'favorite', 'partner'],
  'Soulmates': ['soulmates', 'love', 'couple', 'forever', 'destiny', 'fate', 'connection'],
  'XOXO': ['xoxo', 'hugs and kisses', 'love', 'kisses', 'gossip girl', 'letter'],
  'Wild & Free': ['wild', 'free', 'adventure', 'quote', 'spirit', 'nature', 'boho'],
  'Good Vibes': ['good vibes', 'vibes', 'positive', 'happy', 'chill', 'quote', 'energy'],
  'Made with Love': ['made with love', 'love', 'craft', 'handmade', 'special', 'care'],
  'Main Character': ['main character', 'energy', 'star', 'iconic', 'quote', 'hero', 'vibe'],
  'Since 2024 ♡': ['since', 'anniversary', 'date', 'year', 'love', 'couple', 'milestone', 'heart'],
  'Together': ['together', 'couple', 'love', 'always', 'united', 'quote'],
  'Only You': ['only you', 'love', 'special', 'romance', 'crush', 'dedicated'],
  'Best Day Ever': ['best day ever', 'happy', 'celebration', 'wedding', 'birthday', 'day', 'fun'],
  'Love You Most': ['love you most', 'love', 'quote', 'family', 'sweet', 'romance'],
  'True Love': ['true love', 'love', 'romance', 'forever', 'fairy tale'],
  'Dream Big': ['dream big', 'inspire', 'motivation', 'quote', 'goals', 'ambition'],

  // Badges & Insignias
  '★ VIP ★': ['vip', 'star', 'badge', 'gold', 'exclusive', 'important', 'member'],
  '✔ VERIFIED': ['verified', 'check', 'check mark', 'badge', 'official', 'blue check', 'true'],
  'ORIGINAL': ['original', 'og', 'badge', 'authentic', 'first', 'genuine'],
  'TOP SPOT': ['top spot', 'spot', 'badge', 'best', 'number one', 'winner'],
  'LIMITED': ['limited', 'edition', 'rare', 'badge', 'exclusive', 'special'],
  'LEGENDARY': ['legendary', 'legend', 'badge', 'mythic', 'epic', 'rare'],
  '100% REAL': ['real', '100', 'authentic', 'badge', 'hundred', 'genuine'],
  'NEO': ['neo', 'cyber', 'matrix', 'badge', 'future', 'tech'],
  'PASS': ['pass', 'entry', 'ticket', 'badge', 'access', 'vip'],
  'SPOTLIGHT': ['spotlight', 'star', 'featured', 'badge', 'light', 'showcase'],
};

/**
 * Normalizes query string: trims, lowercases, and stems simple English plurals
 */
export function normalizeQuery(query: string): string {
  const clean = query.trim().toLowerCase();
  if (clean === 'cookies') return 'cookie';
  if (clean.endsWith('berries')) return clean.replace('berries', 'berry');
  if (clean.endsWith('ies') && clean.length > 4) {
    return clean.slice(0, -3) + 'y';
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 2) {
    return clean.slice(0, -1);
  }
  return clean;
}

/**
 * Checks if an emoji or sticker item matches a search query
 */
export function matchesStickerSearch(
  emoji: string,
  categoryName: string,
  categoryId: string,
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const normalized = normalizeQuery(rawQuery);

  // 1. Exact string containment (e.g. searching "Forever" or "VIP" or pasting emoji directly)
  if (emoji.toLowerCase().includes(rawQuery) || emoji.toLowerCase().includes(normalized)) {
    return true;
  }

  // 2. Category name or ID match (e.g. searching "Love", "Halloween", "Cool", "Spooky")
  if (
    categoryName.toLowerCase().includes(rawQuery) ||
    categoryName.toLowerCase().includes(normalized) ||
    categoryId.toLowerCase().includes(rawQuery) ||
    categoryId.toLowerCase().includes(normalized)
  ) {
    return true;
  }

  // 3. Keyword dictionary lookup
  const keywords = EMOJI_KEYWORD_MAP[emoji];
  if (keywords && keywords.length > 0) {
    // Check if any keyword matches
    const words = rawQuery.split(/\s+/).filter(Boolean);
    const matchesAllWords = words.every((w) => {
      const nw = normalizeQuery(w);
      return keywords.some((kw) => {
        const nkw = kw.toLowerCase();
        return nkw === w || nkw === nw || nkw.includes(w) || nkw.includes(nw);
      });
    });
    if (matchesAllWords) return true;
  }

  return false;
}
