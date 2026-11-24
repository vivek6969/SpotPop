import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ProductTier, StickerItem } from '../src/types/index.ts';
import { PlanDraft } from '../src/components/modals/editor/types.ts';

// Default drafts mirror CreateSpotModal.tsx definitions
const DEFAULT_MINI_DRAFT: PlanDraft = {
  headline: 'Note to the Universe ✨',
  secondaryText: 'A little corner of my own.',
  creatorName: 'Pioneer',
  fontFamily: 'Caveat',
  fontSize: 22,
  textColor: '#1E293B',
  backgroundColor: '#FEF08A',
  alignment: 'center',
  textOpacity: 1,
  frameStyle: 'tape',
  shape: 'sticky',
  stickers: [
    { id: 'mini_stk_1', emojiOrIcon: '♡', x: 125, y: 15, size: 26, rotation: 8, opacity: 1 },
  ],
  photoAdjustments: {
    brightness: 0,
    contrast: 0,
    exposure: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    blur: 0,
    blurType: 'gaussian',
    vignette: 0,
    grain: 0,
    sharpen: 0,
  },
  layers: [],
};

const DEFAULT_BIG_DRAFT: PlanDraft = {
  headline: 'Golden Memories',
  secondaryText: 'Captured forever on the SpotPop wall.',
  creatorName: 'Artist',
  fontFamily: 'Caveat',
  fontSize: 22,
  textColor: '#FFFFFF',
  backgroundColor: '#0F172A',
  frameStyle: 'washi',
  alignment: 'center',
  textOpacity: 1,
  shape: 'polaroid',
  imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
  imageFit: 'cover',
  photoOpacity: 1,
  photoZoom: 1,
  stickers: [
    { id: 'big_stk_1', emojiOrIcon: '💖', x: 125, y: 20, size: 28, rotation: -6, opacity: 1 },
    { id: 'big_stk_2', emojiOrIcon: '✨', x: 20, y: 20, size: 26, rotation: 12, opacity: 0.9 },
  ],
  photoAdjustments: {
    brightness: 0,
    contrast: 0,
    exposure: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    blur: 0,
    blurType: 'gaussian',
    vignette: 0,
    grain: 0,
    sharpen: 0,
  },
  layers: [],
};

// State Simulator mimicking CreateSpotModal's exact hooks and handlers
class StudioEditorSimulator {
  tier: ProductTier;
  miniDraft: PlanDraft;
  bigDraft: PlanDraft;
  activeEditorTab: string;
  mobileActiveSheet: string | null;
  selectedItemId: string | null;
  isDrawingMode: boolean;
  undoHistory: PlanDraft[];
  redoHistory: PlanDraft[];

  constructor(initialTier: ProductTier = 'mini_pop') {
    this.tier = initialTier;
    this.miniDraft = JSON.parse(JSON.stringify(DEFAULT_MINI_DRAFT));
    this.bigDraft = JSON.parse(JSON.stringify(DEFAULT_BIG_DRAFT));
    this.activeEditorTab = initialTier === 'big_pop' ? 'photo' : 'text';
    this.mobileActiveSheet = null;
    this.selectedItemId = null;
    this.isDrawingMode = false;
    this.undoHistory = [];
    this.redoHistory = [];
  }

  get currentDraft(): PlanDraft {
    return this.tier === 'big_pop' ? this.bigDraft : this.miniDraft;
  }

  saveHistorySnapshot(draftToSave: PlanDraft) {
    if (
      this.undoHistory.length > 0 &&
      JSON.stringify(this.undoHistory[this.undoHistory.length - 1]) === JSON.stringify(draftToSave)
    ) {
      return;
    }
    this.undoHistory = [...this.undoHistory.slice(-30), JSON.parse(JSON.stringify(draftToSave))];
    this.redoHistory = [];
  }

  updateDraft(updates: Partial<PlanDraft>, immediateHistory = false) {
    if (immediateHistory) {
      this.saveHistorySnapshot(this.currentDraft);
    }
    if (this.tier === 'big_pop') {
      this.bigDraft = { ...this.bigDraft, ...updates };
    } else {
      this.miniDraft = { ...this.miniDraft, ...updates };
    }
  }

  handleSelectPlan(newTier: ProductTier) {
    this.tier = newTier;
    this.selectedItemId = null;
    this.isDrawingMode = false;
    if (newTier === 'mini_pop') {
      this.activeEditorTab = 'text';
    }
  }

  handleUndo() {
    if (this.undoHistory.length === 0) return;
    const previous = this.undoHistory[this.undoHistory.length - 1];
    this.redoHistory = [...this.redoHistory.slice(-30), JSON.parse(JSON.stringify(this.currentDraft))];
    this.undoHistory = this.undoHistory.slice(0, -1);
    if (this.tier === 'big_pop') {
      this.bigDraft = previous;
    } else {
      this.miniDraft = previous;
    }
  }

  handleRedo() {
    if (this.redoHistory.length === 0) return;
    const next = this.redoHistory[this.redoHistory.length - 1];
    this.undoHistory = [...this.undoHistory.slice(-30), JSON.parse(JSON.stringify(this.currentDraft))];
    this.redoHistory = this.redoHistory.slice(0, -1);
    if (this.tier === 'big_pop') {
      this.bigDraft = next;
    } else {
      this.miniDraft = next;
    }
  }

  addSticker(emoji: string) {
    const limit = this.tier === 'big_pop' ? 24 : 12;
    if (this.currentDraft.stickers.length >= limit) return false;
    const newSticker: StickerItem = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      emojiOrIcon: emoji,
      x: 50,
      y: 50,
      size: 28,
      rotation: 0,
      opacity: 1,
    };
    this.updateDraft(
      {
        stickers: [...this.currentDraft.stickers, newSticker],
      },
      true
    );
    return true;
  }
}

describe('Studio Editor State Integrity & Tab Switching', () => {
  test('Initial state reflects tier selection correctly', () => {
    const miniEditor = new StudioEditorSimulator('mini_pop');
    assert.equal(miniEditor.tier, 'mini_pop');
    assert.equal(miniEditor.currentDraft.shape, 'sticky');
    assert.equal(miniEditor.currentDraft.imageUrl, undefined);
    assert.equal(miniEditor.activeEditorTab, 'text');

    const bigEditor = new StudioEditorSimulator('big_pop');
    assert.equal(bigEditor.tier, 'big_pop');
    assert.equal(bigEditor.currentDraft.shape, 'polaroid');
    assert.ok(bigEditor.currentDraft.imageUrl);
    assert.equal(bigEditor.activeEditorTab, 'photo');
  });

  test('Switching from Big Pop to Mini Pop forces active tab to "text"', () => {
    const editor = new StudioEditorSimulator('big_pop');
    editor.activeEditorTab = 'photo';
    editor.selectedItemId = 'photo';
    editor.isDrawingMode = true;

    // User switches to Mini Pop
    editor.handleSelectPlan('mini_pop');

    assert.equal(editor.tier, 'mini_pop');
    assert.equal(editor.activeEditorTab, 'text');
    assert.equal(editor.selectedItemId, null);
    assert.equal(editor.isDrawingMode, false);
  });

  test('Tool availability restrictions between Mini Pop and Big Pop', () => {
    const getAvailableMobileTools = (tier: ProductTier) => {
      const allTools = [
        ...(tier === 'big_pop' ? [{ id: 'photo', label: 'Tools' }] : []),
        { id: 'adjust', label: 'Adjust' },
        ...(tier === 'big_pop' ? [{ id: 'retouch', label: 'Retouch' }] : []),
        { id: 'text', label: 'Text' },
        { id: 'stickers', label: 'Stickers' },
        { id: 'draw', label: 'Draw' },
        { id: 'frames', label: 'Frames' },
        { id: 'themes', label: 'Background' },
        ...(tier === 'big_pop' ? [{ id: 'audio', label: 'Audio' }] : []),
      ];
      return allTools.map((t) => t.id);
    };

    const bigTools = getAvailableMobileTools('big_pop');
    assert.ok(bigTools.includes('photo'));
    assert.ok(bigTools.includes('retouch'));
    assert.ok(bigTools.includes('audio'));
    assert.equal(bigTools.length, 9);

    const miniTools = getAvailableMobileTools('mini_pop');
    assert.equal(miniTools.includes('photo'), false);
    assert.equal(miniTools.includes('retouch'), false);
    assert.equal(miniTools.includes('audio'), false);
    assert.equal(miniTools.length, 6);

    // AUDIT OBSERVATION: 'draw' is present in miniTools despite 'No freehand drawing pen' restriction
    assert.ok(miniTools.includes('draw'));
  });

  test('Sticker count limits strictly enforced per tier (12 for Mini, 24 for Big)', () => {
    const miniEditor = new StudioEditorSimulator('mini_pop');
    // Mini Pop initial draft starts with 1 sticker
    assert.equal(miniEditor.currentDraft.stickers.length, 1);
    for (let i = 0; i < 20; i++) {
      miniEditor.addSticker('⭐');
    }
    // Mini Pop must be capped at 12
    assert.equal(miniEditor.currentDraft.stickers.length, 12);

    const bigEditor = new StudioEditorSimulator('big_pop');
    // Big Pop initial draft starts with 2 stickers
    assert.equal(bigEditor.currentDraft.stickers.length, 2);
    for (let i = 0; i < 30; i++) {
      bigEditor.addSticker('🌟');
    }
    // Big Pop must be capped at 24
    assert.equal(bigEditor.currentDraft.stickers.length, 24);
  });
});

describe('Draft Isolation between Mini and Big Pop', () => {
  test('Modifying Mini Pop draft does NOT mutate Big Pop draft', () => {
    const editor = new StudioEditorSimulator('mini_pop');
    editor.updateDraft({ headline: 'Mini Custom Title', textColor: '#FF0055' });

    assert.equal(editor.miniDraft.headline, 'Mini Custom Title');
    assert.equal(editor.miniDraft.textColor, '#FF0055');
    // Big Pop draft retains its own untouched defaults
    assert.equal(editor.bigDraft.headline, 'Golden Memories');
    assert.equal(editor.bigDraft.textColor, '#FFFFFF');
  });

  test('Modifying Big Pop draft does NOT mutate Mini Pop draft', () => {
    const editor = new StudioEditorSimulator('big_pop');
    editor.updateDraft({
      headline: 'Big Party Night',
      photoZoom: 1.8,
      audioDraft: {
        previewUrl: 'blob:audio/123',
        duration: 9.5,
        type: 'voice',
        mimeType: 'audio/webm',
      },
    });

    assert.equal(editor.bigDraft.headline, 'Big Party Night');
    assert.equal(editor.bigDraft.photoZoom, 1.8);
    assert.ok(editor.bigDraft.audioDraft);

    // Mini Pop must remain pristine without audio or photo modifications
    assert.equal(editor.miniDraft.headline, 'Note to the Universe ✨');
    assert.equal(editor.miniDraft.audioDraft, undefined);
    assert.equal(editor.miniDraft.imageUrl, undefined);
  });

  test('Switching plans and returning preserves each plan draft modifications', () => {
    const editor = new StudioEditorSimulator('mini_pop');
    editor.updateDraft({ headline: 'Mini Unique' });

    // Switch to Big Pop
    editor.handleSelectPlan('big_pop');
    editor.updateDraft({ headline: 'Big Unique' });

    // Switch back to Mini Pop
    editor.handleSelectPlan('mini_pop');
    assert.equal(editor.currentDraft.headline, 'Mini Unique');

    // Switch back to Big Pop
    editor.handleSelectPlan('big_pop');
    assert.equal(editor.currentDraft.headline, 'Big Unique');
  });

  test('CRITICAL AUDIT DEFECT: Single undo/redo history array leaks Big Pop draft into Mini Pop', () => {
    // Reproduction of the bug in CreateSpotModal.tsx where undoHistory is not scoped per-tier
    const editor = new StudioEditorSimulator('big_pop');

    // 1. User edits in Big Pop: adds sticker and changes photo zoom
    editor.updateDraft({ headline: 'Big Pop Title Before Undo' }, true);
    assert.equal(editor.undoHistory.length, 1);

    // 2. User switches to Mini Pop
    editor.handleSelectPlan('mini_pop');
    assert.equal(editor.tier, 'mini_pop');
    assert.equal(editor.miniDraft.headline, 'Note to the Universe ✨');

    // 3. User clicks Undo while in Mini Pop
    // In CreateSpotModal.tsx:
    // const previous = undoHistory[undoHistory.length - 1]; // This is the Big Pop snapshot!
    // if (tier === 'big_pop') { setBigDraft(previous); } else { setMiniDraft(previous); }
    editor.handleUndo();

    // AUDIT PROOF OF DEFECT:
    // The previous snapshot from Big Pop (which contains photo imageUrl, Big Pop shape, etc.)
    // was applied directly to miniDraft!
    assert.equal(editor.miniDraft.headline, 'Golden Memories');
    assert.equal(editor.miniDraft.shape, 'polaroid');
    assert.ok(editor.miniDraft.imageUrl); // Mini Pop now erroneously contains Big Pop's photo!
  });
});

describe('Undo / Redo History Mechanics', () => {
  test('Snapshot deduplication ignores identical consecutive states', () => {
    const editor = new StudioEditorSimulator('mini_pop');
    editor.saveHistorySnapshot(editor.currentDraft);
    assert.equal(editor.undoHistory.length, 1);

    // Attempting to save the same state again without changes
    editor.saveHistorySnapshot(editor.currentDraft);
    assert.equal(editor.undoHistory.length, 1); // Deduplicated!
  });

  test('AUDIT DEFECT: History stack depth off-by-one cap allows 31 items instead of 30', () => {
    // In CreateSpotModal.tsx: [...prev.slice(-30), draftToSave]
    // When prev has 30 items, slice(-30) preserves 30 items, and appending draftToSave results in 31 items.
    const editor = new StudioEditorSimulator('mini_pop');
    for (let i = 1; i <= 50; i++) {
      editor.updateDraft({ headline: `Version #${i}` }, true);
    }
    // Off-by-one bug in CreateSpotModal: length is 31 instead of intended 30
    assert.equal(editor.undoHistory.length, 31);
    assert.equal(editor.undoHistory[30].headline, 'Version #49');
  });

  test('Redo stack is invalidated when a new update occurs', () => {
    const editor = new StudioEditorSimulator('mini_pop');
    editor.updateDraft({ headline: 'Step 1' }, true);
    editor.updateDraft({ headline: 'Step 2' }, true);

    // Undo step 2
    editor.handleUndo();
    assert.equal(editor.redoHistory.length, 1);

    // Applying a new edit must clear redo history
    editor.updateDraft({ headline: 'Step 3' }, true);
    assert.equal(editor.redoHistory.length, 0);
  });

  test('Undo and Redo traversal preserves state transitions', () => {
    const editor = new StudioEditorSimulator('mini_pop');
    editor.updateDraft({ headline: 'Original' }, true);
    editor.updateDraft({ headline: 'Modified' }, true);

    assert.equal(editor.currentDraft.headline, 'Modified');

    editor.handleUndo();
    assert.equal(editor.currentDraft.headline, 'Original');

    editor.handleRedo();
    assert.equal(editor.currentDraft.headline, 'Modified');
  });
});

describe('Verified Tier-Isolated Undo/Redo Engine', () => {
  class TierIsolatedStudioSimulator {
    tier: ProductTier;
    miniDraft: PlanDraft;
    bigDraft: PlanDraft;
    miniUndoHistory: PlanDraft[] = [];
    miniRedoHistory: PlanDraft[] = [];
    bigUndoHistory: PlanDraft[] = [];
    bigRedoHistory: PlanDraft[] = [];

    constructor(initialTier: ProductTier = 'mini_pop') {
      this.tier = initialTier;
      this.miniDraft = JSON.parse(JSON.stringify(DEFAULT_MINI_DRAFT));
      this.bigDraft = JSON.parse(JSON.stringify(DEFAULT_BIG_DRAFT));
    }

    get currentDraft(): PlanDraft {
      return this.tier === 'big_pop' ? this.bigDraft : this.miniDraft;
    }

    saveHistorySnapshot(draftToSave: PlanDraft) {
      if (this.tier === 'big_pop') {
        this.bigUndoHistory = [...this.bigUndoHistory, JSON.parse(JSON.stringify(draftToSave))].slice(-30);
        this.bigRedoHistory = [];
      } else {
        this.miniUndoHistory = [...this.miniUndoHistory, JSON.parse(JSON.stringify(draftToSave))].slice(-30);
        this.miniRedoHistory = [];
      }
    }

    updateDraft(updates: Partial<PlanDraft>, immediate = false) {
      if (immediate) this.saveHistorySnapshot(this.currentDraft);
      if (this.tier === 'big_pop') {
        this.bigDraft = { ...this.bigDraft, ...updates };
      } else {
        this.miniDraft = { ...this.miniDraft, ...updates };
      }
    }

    handleSelectPlan(newTier: ProductTier) {
      this.tier = newTier;
    }

    handleUndo() {
      const history = this.tier === 'big_pop' ? this.bigUndoHistory : this.miniUndoHistory;
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      if (this.tier === 'big_pop') {
        this.bigRedoHistory = [...this.bigRedoHistory, JSON.parse(JSON.stringify(this.currentDraft))].slice(-30);
        this.bigUndoHistory = this.bigUndoHistory.slice(0, -1);
        this.bigDraft = prev;
      } else {
        this.miniRedoHistory = [...this.miniRedoHistory, JSON.parse(JSON.stringify(this.currentDraft))].slice(-30);
        this.miniUndoHistory = this.miniUndoHistory.slice(0, -1);
        this.miniDraft = prev;
      }
    }
  }

  test('Tier-isolated history prevents cross-tier undo pollution', () => {
    const editor = new TierIsolatedStudioSimulator('big_pop');
    editor.updateDraft({ headline: 'Big Pop Title' }, true);
    assert.equal(editor.bigUndoHistory.length, 1);
    assert.equal(editor.miniUndoHistory.length, 0);

    // Switch to Mini Pop
    editor.handleSelectPlan('mini_pop');
    // Calling undo in Mini Pop does nothing because mini history is empty!
    editor.handleUndo();
    assert.equal(editor.miniDraft.imageUrl, undefined);
    assert.equal(editor.miniDraft.headline, 'Note to the Universe ✨');
  });

  test('History stack depth strictly adheres to 30-item cap', () => {
    const editor = new TierIsolatedStudioSimulator('mini_pop');
    for (let i = 1; i <= 50; i++) {
      editor.updateDraft({ headline: `Version #${i}` }, true);
    }
    assert.equal(editor.miniUndoHistory.length, 30);
  });

  test('Per-element text styling isolation: Subtext font & color do not pollute headline', () => {
    const editor = new TierIsolatedStudioSimulator('big_pop');
    // Baseline state
    assert.equal(editor.currentDraft.fontFamily, 'Caveat');
    assert.equal(editor.currentDraft.fontSize, 22);
    assert.equal(editor.currentDraft.textColor, '#FFFFFF');

    // Simulate styling when Subtext ('BITCH') is targeted
    editor.updateDraft({
      subtextFontFamily: 'Poppins',
      subtextSize: 18,
      subtextColor: '#FF2E93',
      subtext3D: true,
      subtextGlow: '#00F0FF',
      subtextStroke: '1px #000000',
      subtextLetterSpacing: 2,
    });

    // Headline styling MUST remain completely pristine and unaltered
    assert.equal(editor.currentDraft.fontFamily, 'Caveat');
    assert.equal(editor.currentDraft.fontSize, 22);
    assert.equal(editor.currentDraft.textColor, '#FFFFFF');
    assert.equal(editor.currentDraft.text3D, undefined);
    assert.equal(editor.currentDraft.textGlow, undefined);
    assert.equal(editor.currentDraft.textStroke, undefined);

    // Subtext styling MUST strictly contain the applied properties
    assert.equal(editor.currentDraft.subtextFontFamily, 'Poppins');
    assert.equal(editor.currentDraft.subtextSize, 18);
    assert.equal(editor.currentDraft.subtextColor, '#FF2E93');
    assert.equal(editor.currentDraft.subtext3D, true);
    assert.equal(editor.currentDraft.subtextGlow, '#00F0FF');
    assert.equal(editor.currentDraft.subtextStroke, '1px #000000');
    assert.equal(editor.currentDraft.subtextLetterSpacing, 2);

    // Now update Creator Tag (Author)
    editor.updateDraft({
      authorFontFamily: 'Inter',
      authorColor: '#10B981',
      authorSize: 12,
    });

    // Subtext and Headline remain isolated
    assert.equal(editor.currentDraft.fontFamily, 'Caveat');
    assert.equal(editor.currentDraft.subtextFontFamily, 'Poppins');
    assert.equal(editor.currentDraft.authorFontFamily, 'Inter');
    assert.equal(editor.currentDraft.authorColor, '#10B981');
  });
});
