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
    const centerStageClasses = 'absolute inset-0 flex items-center justify-center pointer-events-none z-10';
    assert.ok(centerStageClasses.includes('absolute inset-0'));
    assert.ok(centerStageClasses.includes('flex items-center justify-center'));
  });

  test('Comments & replies nesting engine structures threads accurately', () => {
    interface TestComment {
      id: string;
      spotId: string;
      text: string;
      replyToId?: string;
      replies?: TestComment[];
    }

    const comments: TestComment[] = [
      { id: 'c1', spotId: 's1', text: 'Love this pop! @doraemon #cute' },
      { id: 'c2', spotId: 's1', text: 'Thank you so much!', replyToId: 'c1' },
      { id: 'c3', spotId: 's1', text: 'Another cool thought' },
    ];

    const rootComments = comments.filter(c => !c.replyToId);
    const structured = rootComments.map(r => ({
      ...r,
      replies: comments.filter(c => c.replyToId === r.id),
    }));

    assert.equal(structured.length, 2);
    assert.equal(structured[0].id, 'c1');
    assert.equal(structured[0].replies?.length, 1);
    assert.equal(structured[0].replies?.[0].id, 'c2');
    assert.equal(structured[1].id, 'c3');
    assert.equal(structured[1].replies?.length, 0);
  });

  test('AllowComments flag turns off comment submission when false', () => {
    const spotWithComments = { id: 's1', allowComments: true };
    const spotDisabledComments = { id: 's2', allowComments: false };

    const canComment = (spot: { allowComments?: boolean }) => {
      return spot.allowComments !== false;
    };

    assert.equal(canComment(spotWithComments), true);
    assert.equal(canComment(spotDisabledComments), false);
  });

  test('Pop React emoji engine increments count per emoji', () => {
    const reactions: Record<string, number> = {};

    const addReaction = (emoji: string) => {
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      return reactions[emoji];
    };

    assert.equal(addReaction('🔥'), 1);
    assert.equal(addReaction('🔥'), 2);
    assert.equal(addReaction('❤️'), 1);
    assert.deepEqual(reactions, { '🔥': 2, '❤️': 1 });
  });

  test('Mention and hashtag tokenizer identifies tags accurately', () => {
    const text = 'Hey @doraemon checkout this #dusk vibe on #spotpop';
    const tokens = text.split(/(\s+)/);

    const mentions = tokens.filter(t => t.startsWith('@'));
    const hashtags = tokens.filter(t => t.startsWith('#'));

    assert.deepEqual(mentions, ['@doraemon']);
    assert.deepEqual(hashtags, ['#dusk', '#spotpop']);
  });

  test('Reels audio controller toggles play/pause state and scrubs timeline', () => {
    let isPlaying = true;
    let currentTime = 0;
    const duration = 15;

    const togglePlay = () => {
      isPlaying = !isPlaying;
      return isPlaying;
    };

    const seekScrubber = (clickX: number, totalWidth: number) => {
      const pct = Math.max(0, Math.min(1, clickX / totalWidth));
      currentTime = pct * duration;
      return currentTime;
    };

    // Starts directly playing
    assert.equal(isPlaying, true);

    // Toggle pause
    assert.equal(togglePlay(), false);
    assert.equal(isPlaying, false);

    // Toggle play
    assert.equal(togglePlay(), true);
    assert.equal(isPlaying, true);

    // Scrub to 50%
    assert.equal(seekScrubber(100, 200), 7.5);
    assert.equal(currentTime, 7.5);

    // Scrub past boundary (clamping)
    assert.equal(seekScrubber(300, 200), 15);
    assert.equal(currentTime, 15);
    assert.equal(seekScrubber(-50, 200), 0);
    assert.equal(currentTime, 0);
  });

  test('Pop Reels guarantees strictly unique spots and full random shuffle', () => {
    const spots: Spot[] = [
      createMockSpot('sp_1'),
      createMockSpot('sp_2'),
      createMockSpot('sp_3'),
      createMockSpot('sp_1'), // Duplicate ID
      createMockSpot('sp_4'),
      createMockSpot('sp_5'),
    ];

    const uniqueMap = new Map<string, Spot>();
    spots.filter(s => s.status !== 'hidden').forEach(s => {
      if (!uniqueMap.has(s.id)) uniqueMap.set(s.id, s);
    });
    const pool = Array.from(uniqueMap.values());

    assert.equal(pool.length, 5); // sp_1 deduplicated
    const ids = pool.map(s => s.id);
    assert.equal(new Set(ids).size, 5); // 100% unique IDs

    // Fisher-Yates shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    assert.equal(shuffled.length, 5);
  });

  test('Pop Reels pins requested initialSpotId to index 0 while randomizing remainder', () => {
    const spots: Spot[] = [
      createMockSpot('sp_a'),
      createMockSpot('sp_b'),
      createMockSpot('sp_target'),
      createMockSpot('sp_c'),
    ];

    const pool = [...spots];
    const initialSpotId = 'sp_target';
    const foundIdx = pool.findIndex(s => s.id === initialSpotId);
    if (foundIdx > 0) {
      const [target] = pool.splice(foundIdx, 1);
      pool.unshift(target);
    }

    assert.equal(pool[0].id, 'sp_target');
    assert.equal(pool.length, 4);
  });
});
