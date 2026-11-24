import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { matchesStickerSearch, normalizeQuery } from '../src/utils/stickerKeywords.ts';
import { STICKER_CATEGORIES } from '../src/components/modals/CreateSpotModal.tsx';

describe('Sticker & Emoji Semantic Search Engine', () => {
  test('Stemming and plural normalization handles English queries', () => {
    assert.equal(normalizeQuery('hearts'), 'heart');
    assert.equal(normalizeQuery('STARS'), 'star');
    assert.equal(normalizeQuery('cookies'), 'cookie');
    assert.equal(normalizeQuery('gaming'), 'gaming');
    assert.equal(normalizeQuery('  love  '), 'love');
  });

  test('Searching "heart" returns all heart emojis and romantic stamps', () => {
    const matched: string[] = [];
    for (const cat of STICKER_CATEGORIES) {
      for (const emoji of cat.emojis) {
        if (matchesStickerSearch(emoji, cat.name, cat.id, 'heart')) {
          matched.push(emoji);
        }
      }
    }

    assert.ok(matched.length >= 10, `Expected at least 10 heart matches, got ${matched.length}`);
    assert.ok(matched.includes('💖'), 'Must include sparkling heart');
    assert.ok(matched.includes('💕'), 'Must include two hearts');
    assert.ok(matched.includes('💘'), 'Must include heart with arrow');
    assert.ok(matched.includes('♡'), 'Must include outline heart');
    assert.ok(matched.includes('❤️‍🔥'), 'Must include heart on fire');
    assert.ok(matched.includes('Forever ♡'), 'Must include Forever stamp');
  });

  test('Plural search "hearts" matches same items as "heart"', () => {
    const matchedSingular = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'heart'))
    );
    const matchedPlural = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'hearts'))
    );

    assert.equal(matchedSingular.length, matchedPlural.length);
  });

  test('Searching "fire" matches fire and heart-on-fire', () => {
    const matched = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'fire'))
    );
    assert.ok(matched.includes('🔥'));
    assert.ok(matched.includes('❤️‍🔥'));
  });

  test('Searching "halloween" or "spooky" matches spooky category items', () => {
    const spookyMatched = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'halloween'))
    );
    assert.ok(spookyMatched.includes('🎃'));
    assert.ok(spookyMatched.includes('👻'));
    assert.ok(spookyMatched.includes('🦇'));
    assert.ok(spookyMatched.includes('💀'));
  });

  test('Searching "gaming" or "controller" matches game pad & joystick', () => {
    const gameMatched = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'gaming'))
    );
    assert.ok(gameMatched.includes('🎮'));
    assert.ok(gameMatched.includes('🕹️'));
  });

  test('Searching "badge" or "vip" matches badges category', () => {
    const badgeMatched = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'badge'))
    );
    assert.ok(badgeMatched.includes('★ VIP ★'));
    assert.ok(badgeMatched.includes('✔ VERIFIED'));
  });

  test('Searching empty query matches all emojis', () => {
    const allCount = STICKER_CATEGORIES.reduce((s, c) => s + c.emojis.length, 0);
    const emptyMatched = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, ''))
    );
    assert.equal(emptyMatched.length, allCount);
  });

  test('Searching nonsense query returns 0 matches gracefully', () => {
    const noMatches = STICKER_CATEGORIES.flatMap((c) =>
      c.emojis.filter((e) => matchesStickerSearch(e, c.name, c.id, 'xyz999foobar'))
    );
    assert.equal(noMatches.length, 0);
  });
});
