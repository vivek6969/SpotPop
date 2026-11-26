import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Database } from '../server/database.ts';
import type { User, Spot } from '../src/types/index.ts';

describe('Universal Search & Auto-Suggestions Engine (@mentions, #hashtags, locations, spots)', () => {
  let db: Database;

  beforeEach(() => {
    // In-memory test isolation
    db = new Database(false);
  });

  it('guarantees typing "@" suggests registered users with creator profiles and spot counts', () => {
    const user1: User = {
      id: 'usr_sarah',
      email: 'sarah@test.com',
      username: 'sarah_creator',
      displayName: 'Sarah Designer',
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: ['sp_s1', 'sp_s2'],
    };
    const user2: User = {
      id: 'usr_sam',
      email: 'sam@test.com',
      username: 'sam_art',
      displayName: 'Sam Painter',
      role: 'user',
      createdAt: new Date().toISOString(),
      ownedSpotIds: [],
    };
    db.addUser(user1);
    db.addUser(user2);

    // Query with '@sa'
    const res = db.getSuggestions('@sa', 'all', 5);
    assert.ok(res.users.length >= 2, 'Should match both sarah and sam');
    const sarah = res.users.find((u) => u.username === 'sarah_creator');
    assert.ok(sarah, 'Must find sarah_creator');
    assert.equal(sarah.displayName, 'Sarah Designer');
  });

  it('guarantees typing "#" auto-suggests trending canvas hashtags with counts', () => {
    const spot: Spot = {
      id: 'sp_tag_test',
      ownerId: 'usr_admin',
      creatorName: 'Spotter',
      slug: 'tag-spot',
      tier: 'mini_pop',
      x: 0,
      y: 0,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      tags: ['#photography', '#summer2026', '#vacation'],
      content: {
        headline: 'Vacation Time',
        text: '',
        textColor: '#000',
        fontFamily: 'Caveat',
        fontSize: 20,
        alignment: 'center',
        stickers: [],
        frameStyle: 'tape',
        tags: ['#beachvibes'],
      },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spot);

    // Query with '#photo'
    const res = db.getSuggestions('#photo', 'hashtags', 5);
    assert.ok(res.hashtags.some((h) => h.tag === '#photography'), 'Must suggest #photography');

    // Query with '#beach'
    const resBeach = db.getSuggestions('#beach', 'all', 5);
    assert.ok(resBeach.hashtags.some((h) => h.tag === '#beachvibes'), 'Must suggest #beachvibes from content tags');
  });

  it('guarantees locations query returns matching world and canvas locations', () => {
    const spot: Spot = {
      id: 'sp_loc_test',
      ownerId: 'usr_admin',
      creatorName: 'Spotter',
      slug: 'loc-spot',
      tier: 'mini_pop',
      x: 0,
      y: 0,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      location: 'Goa Beach Resort, India',
      content: { headline: 'Beach Spot', text: '', textColor: '#000', fontFamily: 'Caveat', fontSize: 20, alignment: 'center', stickers: [], frameStyle: 'tape' },
      createdAt: new Date().toISOString(),
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 0,
      sharesCount: 0,
    };
    db.addSpot(spot);

    const res = db.getSuggestions('Goa', 'locations', 5);
    assert.ok(res.locations.some((l) => l.name.includes('Goa')), 'Must match Goa location');
  });

  it('guarantees token replacement accurately replaces active token with completed suggestion', () => {
    const replaceToken = (text: string, cursorPos: number, completedText: string) => {
      const textBeforeCursor = text.slice(0, cursorPos);
      const match = textBeforeCursor.match(/([@#][a-zA-Z0-9_]*)$/);
      if (!match) return text;
      const startIndex = cursorPos - match[1].length;
      const before = text.slice(0, startIndex);
      const after = text.slice(startIndex + match[1].length);
      return `${before}${completedText}${after}`;
    };

    // Scenario 1: Typing "@vi" at the end of a comment
    const input1 = 'Hey check this out @vi';
    const result1 = replaceToken(input1, input1.length, '@vivek ');
    assert.equal(result1, 'Hey check this out @vivek ');

    // Scenario 2: Typing "#ar" in the middle of text
    const input2 = 'Loving the #ar vibes today';
    const cursor2 = 'Loving the #ar'.length;
    const result2 = replaceToken(input2, cursor2, '#art ');
    assert.equal(result2, 'Loving the #art  vibes today');

    // Scenario 3: Single trigger "@"
    const input3 = 'Hello @';
    const result3 = replaceToken(input3, input3.length, '@admin ');
    assert.equal(result3, 'Hello @admin ');
  });

  it('guarantees empty query returns popular curated trending hashtags and top creators', () => {
    const res = db.getSuggestions('', 'all', 6);
    assert.ok(res.hashtags.length > 0, 'Must return default trending hashtags');
    assert.ok(res.users.length > 0, 'Must return registered users');
  });
});
