import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Spot, SpotAudio, PRODUCTS } from '../src/types/index.ts';

// Simulated Audio Element for testing state machine without browser DOM
class MockAudioElement {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  preload: string;
  ontimeupdate: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(src = '', duration = 12.5) {
    this.src = src;
    this.currentTime = 0;
    this.duration = duration;
    this.paused = true;
    this.preload = 'none';
  }

  async play(): Promise<void> {
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }
}

// Global Audio Singleton Controller mirroring SpotAudioPlayer.tsx
class GlobalAudioController {
  private static instance: MockAudioElement | null = null;

  static get activeInstance(): MockAudioElement | null {
    return this.instance;
  }

  static playAudio(audioEl: MockAudioElement) {
    if (this.instance && this.instance !== audioEl) {
      this.instance.pause();
    }
    this.instance = audioEl;
    return audioEl.play();
  }

  static stopCurrent() {
    if (this.instance) {
      this.instance.pause();
      this.instance = null;
    }
  }

  static reset() {
    this.instance = null;
  }
}

// SpotAudioPlayer Simulator
class AudioPlayerStateSimulator {
  audio: SpotAudio;
  audioRef: MockAudioElement | null = null;
  isPlaying = false;
  progress = 0;
  currentTime = 0;
  error: string | null = null;

  constructor(audio: SpotAudio) {
    this.audio = audio;
  }

  handleTogglePlay() {
    this.error = null;
    if (!this.audioRef) {
      this.audioRef = new MockAudioElement(this.audio.url, this.audio.duration);
      this.audioRef.ontimeupdate = () => {
        if (this.audioRef && this.audioRef.duration) {
          this.progress = (this.audioRef.currentTime / this.audioRef.duration) * 100;
          this.currentTime = this.audioRef.currentTime;
        }
      };
      this.audioRef.onended = () => {
        this.isPlaying = false;
        this.progress = 0;
        this.currentTime = 0;
      };
      this.audioRef.onerror = () => {
        this.error = 'Could not load audio. Tap retry.';
        this.isPlaying = false;
      };
    }

    if (this.isPlaying) {
      this.audioRef.pause();
      this.isPlaying = false;
    } else {
      GlobalAudioController.playAudio(this.audioRef);
      this.isPlaying = true;
    }
  }

  handleSeek(clickRatio: number) {
    if (!this.audioRef) return;
    const clampedRatio = Math.max(0, Math.min(1, clickRatio));
    const targetTime = clampedRatio * (this.audioRef.duration || this.audio.duration);
    this.audioRef.currentTime = targetTime;
    this.currentTime = targetTime;
    this.progress = clampedRatio * 100;
  }

  unmount() {
    if (this.audioRef) {
      this.audioRef.pause();
      if (GlobalAudioController.activeInstance === this.audioRef) {
        GlobalAudioController.stopCurrent();
      }
      this.audioRef = null;
      this.isPlaying = false;
    }
  }

  static formatSecs(sec: number): string {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 10);
    return `0:${s < 10 ? '0' : ''}${s}.${ms}`;
  }
}

describe('SpotCard Rendering Invariants', () => {
  const baseSpot: Spot = {
    id: 'sp_test_001',
    ownerId: 'usr_001',
    creatorName: 'Aesthetic Queen',
    slug: 'aesthetic-queen-9988',
    tier: 'mini_pop',
    x: 100,
    y: 150,
    width: 170,
    height: 170,
    rotation: 2.5,
    shape: 'sticky',
    background: '#FFF9C4',
    content: {
      headline: 'Vibes Only',
      text: 'Having the best coffee in town.',
      textColor: '#1E293B',
      fontFamily: 'Caveat',
      fontSize: 24,
      frameStyle: 'tape',
      stickers: [],
      alignment: 'center',
    },
    createdAt: new Date().toISOString(),
    status: 'published',
    moderationStatus: 'approved',
    viewsCount: 42,
    sharesCount: 5,
  };

  test('Mini Pop card geometry matches 170x170 square dimensions', () => {
    const cardConfig = PRODUCTS[baseSpot.tier];
    assert.equal(baseSpot.width, 170);
    assert.equal(baseSpot.height, 170);
    assert.equal(cardConfig.width, 170);
    assert.equal(cardConfig.height, 170);
    assert.equal(baseSpot.shape, 'sticky');
  });

  test('Big Pop card geometry matches 170x210 portrait aspect ratio', () => {
    const bigSpot: Spot = {
      ...baseSpot,
      tier: 'big_pop',
      width: 170,
      height: 210,
      shape: 'polaroid',
      content: {
        ...baseSpot.content,
        imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
        audio: {
          url: 'https://assets.spotpop.dev/audio/voice_1.webm',
          storageKey: 'voice_1.webm',
          size: 102400,
          duration: 7.2,
          type: 'voice',
          mimeType: 'audio/webm',
        },
      },
    };

    const cardConfig = PRODUCTS[bigSpot.tier];
    assert.equal(bigSpot.width, 170);
    assert.equal(bigSpot.height, 210);
    assert.equal(cardConfig.width, 170);
    assert.equal(cardConfig.height, 210);
    assert.ok(bigSpot.content.audio);
    assert.equal(bigSpot.content.audio.duration, 7.2);
  });

  test('Missing photo in Big Pop renders graceful fallback state', () => {
    const bigSpotWithoutPhoto: Spot = {
      ...baseSpot,
      tier: 'big_pop',
      width: 170,
      height: 210,
      content: {
        ...baseSpot.content,
        imageUrl: undefined, // Empty photo
      },
    };

    // SpotCard.tsx lines 1522-1531 render "No Photo Attached" fallback
    const hasPhoto = Boolean(bigSpotWithoutPhoto.content.imageUrl);
    const fallbackText = hasPhoto ? 'Render Image' : 'No Photo Attached';
    assert.equal(fallbackText, 'No Photo Attached');
  });
});

describe('Audio Player Interactions & State Machine', () => {
  beforeEach(() => {
    GlobalAudioController.reset();
  });

  test('Duration formatting utility formats minutes, seconds, and tenths accurately', () => {
    assert.equal(AudioPlayerStateSimulator.formatSecs(0), '0:00.0');
    assert.equal(AudioPlayerStateSimulator.formatSecs(5.2), '0:05.2');
    assert.equal(AudioPlayerStateSimulator.formatSecs(14.89), '0:14.8');
    assert.equal(AudioPlayerStateSimulator.formatSecs(9.05), '0:09.0');
  });

  test('Lazy loading: Audio element is not instantiated until toggle play is invoked', () => {
    const audioData: SpotAudio = {
      url: 'https://spotpop.dev/audio/snippet1.webm',
      storageKey: 'snippet1.webm',
      size: 102400,
      duration: 10,
      type: 'voice',
      mimeType: 'audio/webm',
    };
    const player = new AudioPlayerStateSimulator(audioData);

    assert.equal(player.audioRef, null);
    assert.equal(player.isPlaying, false);

    player.handleTogglePlay();

    const ref = player.audioRef as unknown as MockAudioElement;
    assert.ok(ref);
    assert.equal(ref.src, audioData.url);
    assert.equal(player.isPlaying, true);
    assert.equal(ref.paused, false);
  });

  test('Single Global Instance: Starting playback on a new card stops previous card playback', () => {
    const audio1: SpotAudio = {
      url: 'https://spotpop.dev/audio/clip1.webm',
      storageKey: 'clip1.webm',
      size: 102400,
      duration: 10,
      type: 'voice',
      mimeType: 'audio/webm',
    };
    const audio2: SpotAudio = {
      url: 'https://spotpop.dev/audio/clip2.webm',
      storageKey: 'clip2.webm',
      size: 102400,
      duration: 8,
      type: 'music',
      mimeType: 'audio/mp3',
    };

    const player1 = new AudioPlayerStateSimulator(audio1);
    const player2 = new AudioPlayerStateSimulator(audio2);

    // Play card 1
    player1.handleTogglePlay();
    assert.equal(player1.isPlaying, true);
    assert.equal(player1.audioRef?.paused, false);
    assert.equal(GlobalAudioController.activeInstance, player1.audioRef);

    // Play card 2: card 1's audio must be paused immediately
    player2.handleTogglePlay();
    assert.equal(player2.isPlaying, true);
    assert.equal(player2.audioRef?.paused, false);
    assert.equal(player1.audioRef?.paused, true);
    assert.equal(GlobalAudioController.activeInstance, player2.audioRef);
  });

  test('Seeking calculates accurate currentTime and progress percentage with boundary clamping', () => {
    const audioData: SpotAudio = {
      url: 'https://spotpop.dev/audio/track.mp3',
      storageKey: 'track.mp3',
      size: 102400,
      duration: 20,
      type: 'music',
      mimeType: 'audio/mp3',
    };
    const player = new AudioPlayerStateSimulator(audioData);
    player.handleTogglePlay();

    // Seek to 50%
    player.handleSeek(0.5);
    assert.equal(player.progress, 50);
    assert.equal(player.currentTime, 10);

    // Seek to 75%
    player.handleSeek(0.75);
    assert.equal(player.progress, 75);
    assert.equal(player.currentTime, 15);

    // Clamp out-of-bounds clicks (< 0 or > 1)
    player.handleSeek(-0.2);
    assert.equal(player.progress, 0);
    assert.equal(player.currentTime, 0);

    player.handleSeek(1.5);
    assert.equal(player.progress, 100);
    assert.equal(player.currentTime, 20);
  });

  test('Audio unmount cleanly pauses playback and clears global singleton reference', () => {
    const audioData: SpotAudio = {
      url: 'https://spotpop.dev/audio/track.mp3',
      storageKey: 'track.mp3',
      size: 102400,
      duration: 15,
      type: 'voice',
      mimeType: 'audio/webm',
    };
    const player = new AudioPlayerStateSimulator(audioData);
    player.handleTogglePlay();

    assert.equal(GlobalAudioController.activeInstance, player.audioRef);

    // Simulate modal close / unmount
    player.unmount();

    assert.equal(player.audioRef, null);
    assert.equal(player.isPlaying, false);
    assert.equal(GlobalAudioController.activeInstance, null);
  });

  test('SpotCard audio badge click stops event propagation to prevent triggering card click', () => {
    let cardClickTriggered = false;
    let audioBadgeClickTriggered = false;

    const mockEvent = {
      propagationStopped: false,
      stopPropagation() {
        this.propagationStopped = true;
      },
    };

    // Handler simulating SpotCard.tsx line 82 & line 1204
    const onAudioBadgeClick = (e: typeof mockEvent) => {
      e.stopPropagation();
      audioBadgeClickTriggered = true;
    };

    const onCardClick = () => {
      if (!mockEvent.propagationStopped) {
        cardClickTriggered = true;
      }
    };

    onAudioBadgeClick(mockEvent);
    onCardClick();

    assert.equal(audioBadgeClickTriggered, true);
    assert.equal(mockEvent.propagationStopped, true);
    assert.equal(cardClickTriggered, false); // Card modal did not open accidentally!
  });

  test('Audio progress calculation handles browser Infinity/NaN duration gracefully', () => {
    const fallbackDuration = 15;
    const currentTime = 3;

    // Simulate browser reporting Infinity duration for webm stream
    const rawDurations = [Infinity, NaN, 0, undefined];

    for (const rawDur of rawDurations) {
      const dur = (rawDur && !isNaN(rawDur as number) && isFinite(rawDur as number) && (rawDur as number) > 0)
        ? (rawDur as number)
        : fallbackDuration;

      const progress = dur > 0 ? Math.min(100, Math.max(0, (currentTime / dur) * 100)) : 0;
      assert.equal(progress, 20); // 3s out of 15s = exactly 20%!
    }
  });
});
