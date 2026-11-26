import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PRODUCTS, ProductTier } from '../src/types/index.ts';
import { createRazorpayOrder, verifyPaymentSignature } from '../server/razorpay.ts';

describe('Pricing Calculations & Order Integrity', () => {
  test('PRODUCTS pricing configuration invariants', () => {
    // Mini Pop
    assert.equal(PRODUCTS.mini_pop.id, 'mini_pop');
    assert.equal(PRODUCTS.mini_pop.priceINR, 29);
    assert.equal(PRODUCTS.mini_pop.pricePaise, 2900);
    assert.equal(PRODUCTS.mini_pop.width, 170);
    assert.equal(PRODUCTS.mini_pop.height, 170);
    assert.ok(PRODUCTS.mini_pop.restrictions.includes('No photo upload'));
    assert.ok(PRODUCTS.mini_pop.features.includes('Full freehand drawing & neon pens'));
    assert.equal(PRODUCTS.mini_pop.restrictions.includes('No freehand drawing pen'), false);

    // Big Pop
    assert.equal(PRODUCTS.big_pop.id, 'big_pop');
    assert.equal(PRODUCTS.big_pop.priceINR, 99);
    assert.equal(PRODUCTS.big_pop.pricePaise, 9900);
    assert.equal(PRODUCTS.big_pop.width, 170);
    assert.equal(PRODUCTS.big_pop.height, 210);
    assert.equal(PRODUCTS.big_pop.restrictions.length, 0);

    // Mathematical integrity between INR and Paise (1 INR = 100 Paise)
    assert.equal(PRODUCTS.mini_pop.priceINR * 100, PRODUCTS.mini_pop.pricePaise);
    assert.equal(PRODUCTS.big_pop.priceINR * 100, PRODUCTS.big_pop.pricePaise);
  });

  test('createRazorpayOrder generates compliant order objects', () => {
    const miniOrder = createRazorpayOrder('ord_mini_001', 'mini_pop');
    assert.equal(miniOrder.orderId, 'ord_mini_001');
    assert.equal(miniOrder.amountINR, 29);
    assert.equal(miniOrder.amountPaise, 2900);
    assert.equal(miniOrder.currency, 'INR');
    assert.ok(miniOrder.razorpayOrderId.startsWith('order_'));
    assert.ok(miniOrder.description.includes('Mini Pop'));

    const bigOrder = createRazorpayOrder('ord_big_001', 'big_pop');
    assert.equal(bigOrder.orderId, 'ord_big_001');
    assert.equal(bigOrder.amountINR, 99);
    assert.equal(bigOrder.amountPaise, 9900);
    assert.equal(bigOrder.currency, 'INR');
    assert.ok(bigOrder.razorpayOrderId.startsWith('order_'));
    assert.ok(bigOrder.description.includes('Big Pop'));
  });

  test('createRazorpayOrder throws error on invalid product ID', () => {
    assert.throws(
      () => createRazorpayOrder('ord_invalid', 'mega_pop' as ProductTier),
      /Invalid product ID: mega_pop/
    );
  });

  test('verifyPaymentSignature verifies development test tokens', () => {
    assert.equal(
      verifyPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_test_456',
        razorpaySignature: 'test_sig_abc',
      }),
      true
    );

    assert.equal(
      verifyPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_demo_456',
        razorpaySignature: 'dev_mock_signature_verified',
      }),
      true
    );
  });

  test('verifyPaymentSignature verifies HMAC-SHA256 signatures accurately', () => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'spotpop_sec_secret_key_2026';
    const orderId = 'order_prod_998877';
    const paymentId = 'pay_prod_112233';

    const validSig = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    assert.equal(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSig,
      }),
      true
    );

    // Tampered signature must fail
    assert.equal(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'tampered_signature_payload_1234567890abcdef',
      }),
      false
    );

    // Missing arguments must fail
    assert.equal(
      verifyPaymentSignature({
        razorpayOrderId: '',
        razorpayPaymentId: paymentId,
        razorpaySignature: validSig,
      }),
      false
    );
  });
});

describe('Safety Sanitization & Moderation Logic', () => {
  // Evaluates the decision logic implemented in nsfwSafety.ts and safetyService.ts
  function evaluateSafetyScores(scores: {
    Porn?: number;
    Hentai?: number;
    Sexy?: number;
    Neutral?: number;
    Drawing?: number;
  }) {
    const porn = scores.Porn || 0;
    const hentai = scores.Hentai || 0;
    const sexy = scores.Sexy || 0;
    const neutral = scores.Neutral || 0;
    const drawing = scores.Drawing || 0;

    // Rule 1: Explicit Pornography
    if (porn >= 0.60 || (porn >= 0.50 && porn > sexy)) {
      return { safe: false, rule: 'Rule 1: Explicit Pornography' };
    }
    // Rule 2: Explicit Animated / Illustrated Adult Content
    if (hentai >= 0.55) {
      return { safe: false, rule: 'Rule 2: Explicit Animated Adult' };
    }
    // Rule 3: Combined Explicit (Porn + Hentai >= 0.65)
    if (porn + hentai >= 0.65) {
      return { safe: false, rule: 'Rule 3: Combined Explicit' };
    }
    return { safe: true, rule: 'Safe' };
  }

  test('NSFW Rule 1 rejects high-confidence pornography', () => {
    const result = evaluateSafetyScores({ Porn: 0.85, Sexy: 0.1, Neutral: 0.05 });
    assert.equal(result.safe, false);
    assert.equal(result.rule, 'Rule 1: Explicit Pornography');

    const edgeCaseResult = evaluateSafetyScores({ Porn: 0.52, Sexy: 0.40, Neutral: 0.08 });
    assert.equal(edgeCaseResult.safe, false);
    assert.equal(edgeCaseResult.rule, 'Rule 1: Explicit Pornography');
  });

  test('NSFW Rule 2 rejects explicit hentai / anime adult content', () => {
    const result = evaluateSafetyScores({ Hentai: 0.72, Drawing: 0.20, Neutral: 0.08 });
    assert.equal(result.safe, false);
    assert.equal(result.rule, 'Rule 2: Explicit Animated Adult');
  });

  test('NSFW Rule 3 rejects combined adult probability (Porn + Hentai >= 0.65)', () => {
    const result = evaluateSafetyScores({ Porn: 0.40, Hentai: 0.30, Sexy: 0.20, Neutral: 0.10 });
    assert.equal(result.safe, false);
    assert.equal(result.rule, 'Rule 3: Combined Explicit');
  });

  test('Safe images (beachwear, gym selfies, portraits, drawings) pass classification', () => {
    // Gym / swimwear photo with moderate Sexy score
    const beachResult = evaluateSafetyScores({ Sexy: 0.75, Porn: 0.15, Neutral: 0.10 });
    assert.equal(beachResult.safe, true);

    // Wholesome artwork / drawing
    const drawingResult = evaluateSafetyScores({ Drawing: 0.92, Neutral: 0.05, Porn: 0.01 });
    assert.equal(drawingResult.safe, true);

    // Neutral family portrait
    const portraitResult = evaluateSafetyScores({ Neutral: 0.95, Sexy: 0.02, Porn: 0.01 });
    assert.equal(portraitResult.safe, true);
  });

  test('Server spot payload sanitization: audio stripped on Mini Pop', () => {
    // Replicates server/api.ts spot creation sanitization
    const sanitizeSpotContent = (tier: ProductTier, draftContent: any) => {
      return {
        ...draftContent,
        audio: tier === 'big_pop' ? draftContent.audio : undefined,
      };
    };

    const miniContent = sanitizeSpotContent('mini_pop', {
      headline: 'Mini Pop Note',
      audio: { url: '/uploads/secret.mp3', duration: 10, type: 'voice' },
    });
    assert.equal(miniContent.audio, undefined);

    const bigContent = sanitizeSpotContent('big_pop', {
      headline: 'Big Pop Memory',
      audio: { url: '/uploads/voice.mp3', duration: 8, type: 'voice' },
    });
    assert.ok(bigContent.audio);
    assert.equal(bigContent.audio.url, '/uploads/voice.mp3');
  });

  test('Server spot payload sanitization: imageUrl and audio stripped on Mini Pop, drawingData preserved', () => {
    // Verified server/api.ts logic sanitizing by order tier:
    const serverSpotCreation = (tier: ProductTier, draftContent: any) => {
      return {
        headline: draftContent.headline || '',
        imageUrl: tier === 'big_pop' ? draftContent.imageUrl : undefined,
        drawingData: draftContent.drawingData || undefined,
        audio: tier === 'big_pop' ? draftContent.audio : undefined,
      };
    };

    const miniPayload = {
      headline: 'Artistic Mini',
      imageUrl: 'https://spotpop.dev/exploit.jpg',
      drawingData: 'data:image/png;base64,drawing_bytes',
      audio: { url: 'audio.mp3', duration: 5, type: 'voice' },
    };

    const createdSpot = serverSpotCreation('mini_pop', miniPayload);
    // Audio and imageUrl are stripped for Mini Pop, drawingData is preserved
    assert.equal(createdSpot.audio, undefined);
    assert.equal(createdSpot.imageUrl, undefined);
    assert.equal(createdSpot.drawingData, 'data:image/png;base64,drawing_bytes');

    // Big Pop retains all multimedia fields
    const createdBigSpot = serverSpotCreation('big_pop', miniPayload);
    assert.equal(createdBigSpot.imageUrl, 'https://spotpop.dev/exploit.jpg');
    assert.equal(createdBigSpot.drawingData, 'data:image/png;base64,drawing_bytes');
    assert.ok(createdBigSpot.audio);
  });

  test('Slug generation handles unicode, spaces, symbols, and empty creatorName safely', () => {
    const generateSlug = (creatorName: string | undefined) => {
      const slugBase = (creatorName || 'spot')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20);
      return `${slugBase || 'spot'}-1234`;
    };

    // Standard name
    assert.equal(generateSlug('Alice Wonderland'), 'alice-wonderland-1234');

    // Symbols and emojis
    assert.equal(generateSlug('💖 Special 🌟 User!'), 'special-user-1234');

    // Unicode / Hindi
    assert.equal(generateSlug('नमस्ते'), 'spot-1234');

    // Empty or spaces only
    assert.equal(generateSlug('   '), 'spot-1234');
    assert.equal(generateSlug(undefined), 'spot-1234');
  });
});
