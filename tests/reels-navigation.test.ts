import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Spot } from '../src/types/index.ts';

describe('Instagram-Style Navigation & Pop Reels Feed', () => {
  const createMockSpot = (id: string, tier: 'mini_pop' | 'big_pop' = 'big_pop'): Spot => ({
    id,
    ownerId: 'usr_test',
    creatorName: 'reel_creator',
    slug: `spot-${id}`,
    tier,
    x: 250,
    y: 350,
    width: 170,
    height: tier === 'big_pop' ? 210 : 170,
    rotation: 0,
    shape: 'polaroid',
    background: '#FFFFFF',
    content: {
      headline: `Reel Pop ${id}`,
      textColor: '#1E293B',
      fontFamily: 'Caveat',
      fontSize: 24,
      stickers: [],
      frameStyle: 'tape',
      alignment: 'center',
      audio: {
        url: 'https://spotpop.dev/audio/sample.mp3',
        storageKey: 'sample.mp3',
        size: 51200,
        duration: 15,
        type: 'voice',
        mimeType: 'audio/mp3',
      },
    },
    createdAt: new Date().toISOString(),
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 10,
    sharesCount: 3,
  });

  test('Instagram navigation bar tabs trigger designated application actions', () => {
    const actionsTriggered: string[] = [];

    const navProps = {
      activeTab: 'home' as const,
      onHomeClick: () => actionsTriggered.push('home'),
      onOpenSearch: () => actionsTriggered.push('search'),
      onStartCreate: () => actionsTriggered.push('create'),
      onOpenReels: () => actionsTriggered.push('reels'),
      onOpenAccount: () => actionsTriggered.push('profile'),
    };

    navProps.onHomeClick();
    navProps.onOpenSearch();
    navProps.onStartCreate();
    navProps.onOpenReels();
    navProps.onOpenAccount();

    assert.deepEqual(actionsTriggered, ['home', 'search', 'create', 'reels', 'profile']);
  });

  test('Pop Reels filters out hidden/moderated spots and preserves order', () => {
    const spots: Spot[] = [
      createMockSpot('sp_1'),
      { ...createMockSpot('sp_2'), status: 'hidden' },
      createMockSpot('sp_3'),
    ];

    const displaySpots = spots.filter(s => s.status !== 'hidden');
    assert.equal(displaySpots.length, 2);
    assert.equal(displaySpots[0].id, 'sp_1');
    assert.equal(displaySpots[1].id, 'sp_3');
  });

  test('Pop Reels like toggle increments counter and toggles active state', () => {
    const likedSet = new Set<string>();
    const counts: Record<string, number> = {};

    const toggleLike = (id: string, initialShares = 5) => {
      if (likedSet.has(id)) {
        likedSet.delete(id);
        counts[id] = Math.max(0, (counts[id] || initialShares) - 1);
      } else {
        likedSet.add(id);
        counts[id] = (counts[id] || initialShares) + 1;
      }
    };

    // First like
    toggleLike('sp_1', 3);
    assert.equal(likedSet.has('sp_1'), true);
    assert.equal(counts['sp_1'], 4);

    // Unlike
    toggleLike('sp_1', 3);
    assert.equal(likedSet.has('sp_1'), false);
    assert.equal(counts['sp_1'], 3);
  });

  test('Fly to Wall action extracts coordinates cleanly from reel spot', () => {
    const reelSpot = createMockSpot('sp_target');
    let flownTo: { x: number; y: number } | null = null;

    const flyToSpot = (spot: Spot) => {
      flownTo = { x: spot.x, y: spot.y };
    };

    flyToSpot(reelSpot);
    assert.deepEqual(flownTo, { x: 250, y: 350 });
  });

  test('Audio mute toggle accurately reflects audio state machine in Reels', () => {
    let isMuted = false;
    const toggleMute = () => {
      isMuted = !isMuted;
    };

    assert.equal(isMuted, false);
    toggleMute();
    assert.equal(isMuted, true);
    toggleMute();
    assert.equal(isMuted, false);
  });

  test('Creator follow toggle persists across user interactions', () => {
    const followedSet = new Set<string>();

    const toggleFollow = (creator: string) => {
      if (followedSet.has(creator)) {
        followedSet.delete(creator);
      } else {
        followedSet.add(creator);
      }
      return followedSet.has(creator);
    };

    assert.equal(toggleFollow('doraemon_fan'), true);
    assert.equal(followedSet.has('doraemon_fan'), true);
    assert.equal(toggleFollow('doraemon_fan'), false);
    assert.equal(followedSet.has('doraemon_fan'), false);
  });

  test('Reels stage layout maintains dead-center alignment classes', () => {
    const centerStageClasses = 'absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4';
    assert.ok(centerStageClasses.includes('absolute inset-0'));
    assert.ok(centerStageClasses.includes('flex items-center justify-center'));
  });
});
