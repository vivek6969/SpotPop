import React, { useState } from 'react';
import { Spot } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';
import { SpotPopLogo } from '../brand/SpotPopLogo';

interface ViralShareKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: Spot;
}

type ShareFormat = 'story' | 'square' | 'portrait' | 'whatsapp';

const FORMATS: Record<ShareFormat, { label: string; width: number; height: number; aspect: string }> = {
  story: { label: 'Instagram Story (9:16)', width: 1080, height: 1920, aspect: 'aspect-[9/16]' },
  square: { label: 'Square Post (1:1)', width: 1080, height: 1080, aspect: 'aspect-square' },
  portrait: { label: 'Portrait Post (4:5)', width: 1080, height: 1350, aspect: 'aspect-[4/5]' },
  whatsapp: { label: 'WhatsApp Status', width: 1080, height: 1920, aspect: 'aspect-[9/16]' },
};

export const ViralShareKitModal: React.FC<ViralShareKitModalProps> = ({
  isOpen,
  onClose,
  spot,
}) => {
  if (!isOpen) return null;

  const [activeFormat, setActiveFormat] = useState<ShareFormat>('story');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);

  // Generate public link & short vanity display link
  const publicUrl = `${window.location.origin}?spot=${spot.slug || spot.id}`;
  const shortDisplayUrl = `spotpop.in/${spot.slug || spot.id}`;

  // Record share event
  const trackShare = () => {
    api.recordShare(spot.id);
  };

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    trackShare();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Native Web Share
  const handleNativeShare = async () => {
    trackShare();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SpotPop — ${spot.creatorName}'s Spot`,
          text: `I claimed my spot on the internet! 🌟 Check it out here:`,
          url: publicUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    trackShare();
    const text = encodeURIComponent(
      `I claimed my spot on SPOTPOP! 🌟 Check it out here: ${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Download high-resolution PNG rendering matching the aesthetic story style
  const handleDownloadImage = async () => {
    setIsGeneratingDownload(true);
    trackShare();

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const cfg = FORMATS[activeFormat];
      const canvas = document.createElement('canvas');
      canvas.width = cfg.width;
      canvas.height = cfg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = cfg.width;
      const H = cfg.height;

      // 1. Deep cinematic background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#10131F');
      bgGrad.addColorStop(0.4, '#0B0D15');
      bgGrad.addColorStop(0.8, '#06070B');
      bgGrad.addColorStop(1, '#030406');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Sunset & neon ambient glows in corners
      // Top-left sunset glow
      const sunsetGlow = ctx.createRadialGradient(0, 0, 80, 0, 0, W * 0.7);
      sunsetGlow.addColorStop(0, 'rgba(255, 115, 0, 0.32)');
      sunsetGlow.addColorStop(0.5, 'rgba(255, 46, 147, 0.18)');
      sunsetGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunsetGlow;
      ctx.fillRect(0, 0, W, H);

      // Bottom-right purple/magenta glow
      const purpleGlow = ctx.createRadialGradient(W, H, 100, W, H, W * 0.75);
      purpleGlow.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
      purpleGlow.addColorStop(0.5, 'rgba(255, 46, 147, 0.22)');
      purpleGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, W, H);

      // 3. Top Header: SP Sticky Note Emblem + SpotPop Brand Logo
      const headerY = H > 1400 ? 160 : 110;

      // Draw SP sticky note emblem on canvas
      ctx.save();
      const logoX = W / 2 - 135;
      const logoY = headerY - 32;
      const logoSize = 64;

      ctx.translate(logoX + logoSize / 2, logoY + logoSize / 2);
      ctx.rotate(-0.09); // -5.5 deg

      // Sticky note body
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.roundRect(-logoSize / 2, -logoSize / 2, logoSize, logoSize, 12);
      ctx.fill();

      // Folded corner
      ctx.fillStyle = '#FFB3D4';
      ctx.beginPath();
      ctx.moveTo(logoSize / 2 - 16, logoSize / 2);
      ctx.lineTo(logoSize / 2, logoSize / 2 - 16);
      ctx.lineTo(logoSize / 2 - 16, logoSize / 2 - 16);
      ctx.closePath();
      ctx.fill();

      // Translucent Tape at top
      ctx.fillStyle = 'rgba(255, 224, 237, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-14, -logoSize / 2 - 6, 28, 12, 3);
      ctx.fill();

      // "SP" letters
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 30px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SP', 0, 3);
      ctx.restore();

      // SpotPop Brand typography
      ctx.font = '900 68px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Spot', W / 2 - 55, headerY + 12);

      ctx.fillStyle = '#FF1493';
      ctx.fillText('Pop', W / 2 + 80, headerY + 12);

      // 4. Headline: "I Claimed My Spot on the Internet!"
      const titleY = headerY + 110;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 88px Caveat, cursive';
      ctx.fillText('I Claimed My', W / 2, titleY);
      ctx.fillText('Spot on the Internet!', W / 2, titleY + 95);

      // Hot pink underline brush stroke
      ctx.strokeStyle = '#FF2E93';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W / 2 - 270, titleY + 125);
      ctx.quadraticCurveTo(W / 2, titleY + 112, W / 2 + 280, titleY + 122);
      ctx.stroke();

      // Yellow accent rays top-right
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(W / 2 + 370, titleY - 40);
      ctx.lineTo(W / 2 + 420, titleY - 75);
      ctx.moveTo(W / 2 + 395, titleY - 15);
      ctx.lineTo(W / 2 + 445, titleY - 40);
      ctx.stroke();

      // Sparkle star on left
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('✧', W / 2 - 380, titleY + 20);
      ctx.restore();

      // 5. Center: The User's Spot Card
      const spotW = 600;
      const spotH = spot.tier === 'big_pop' ? 720 : 600;
      const spotX = (W - spotW) / 2;
      const spotY = H > 1400 ? 520 : 410;

      ctx.save();
      // Slight organic tilt
      const rotDeg = -1.8;
      ctx.translate(W / 2, spotY + spotH / 2);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.translate(-W / 2, -(spotY + spotH / 2));

      // Card Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 55;
      ctx.shadowOffsetY = 28;

      // Card Background
      ctx.fillStyle = spot.shape === 'polaroid' ? '#FFFFFF' : spot.background || '#FEF08A';
      ctx.beginPath();
      ctx.roundRect(spotX, spotY, spotW, spotH, 12);
      ctx.fill();
      ctx.restore();

      // Re-apply rotation context for contents
      ctx.save();
      ctx.translate(W / 2, spotY + spotH / 2);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.translate(-W / 2, -(spotY + spotH / 2));

      // Polaroid photo image if present
      const pad = 28;
      const photoSize = spotW - pad * 2;
      if (spot.content.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          img.src = spot.content.imageUrl!;
        });
        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(spotX + pad, spotY + pad, photoSize, photoSize, 4);
          ctx.clip();
          ctx.drawImage(img, spotX + pad, spotY + pad, photoSize, photoSize);
          ctx.restore();
        }
      }

      // Drawing layer if present
      if (spot.content.drawingData) {
        const drawImg = new Image();
        drawImg.crossOrigin = 'anonymous';
        await new Promise((res) => {
          drawImg.onload = res;
          drawImg.onerror = res;
          drawImg.src = spot.content.drawingData!;
        });
        if (drawImg.complete && drawImg.naturalWidth > 0) {
          ctx.drawImage(drawImg, spotX + pad, spotY + pad, photoSize, photoSize);
        }
      }

      // Card Headline
      ctx.fillStyle = spot.content.textColor || (spot.shape === 'polaroid' ? '#111827' : '#1E293B');
      ctx.textAlign = 'center';
      ctx.font = 'bold 54px Caveat, cursive';
      const textCenterY = spot.content.imageUrl ? spotY + pad + photoSize + 60 : spotY + spotH * 0.42;
      ctx.fillText(spot.content.headline || spot.creatorName, W / 2, textCenterY);

      // Card Subtext
      if (spot.content.text) {
        ctx.font = '36px Caveat, cursive';
        ctx.fillStyle = spot.content.textColor || (spot.shape === 'polaroid' ? '#4B5563' : '#334155');
        ctx.fillText(spot.content.text, W / 2, textCenterY + 48);
      }

      // Card Author
      ctx.font = '26px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = spot.content.textColor || '#6B7280';
      ctx.fillText(`${spot.creatorName} ♡`, W / 2, textCenterY + 92);

      // Top Scotch Tape Accent
      ctx.fillStyle = 'rgba(235, 230, 215, 0.78)';
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 80, spotY - 18, 160, 36, 3);
      ctx.fill();
      ctx.restore();

      // 6. Whimsical Doodles around the Card
      ctx.save();
      // Paper plane on left
      ctx.font = '64px sans-serif';
      ctx.fillText('✈️', spotX - 85, spotY + spotH * 0.5);

      // Dashed trail for paper plane
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(spotX - 45, spotY + spotH * 0.52);
      ctx.bezierCurveTo(spotX - 110, spotY + spotH * 0.65, spotX - 60, spotY + spotH * 0.75, spotX - 40, spotY + spotH * 0.85);
      ctx.stroke();

      // Doodle Pink Heart top-right
      ctx.fillStyle = '#FB7185';
      ctx.font = 'bold 50px Caveat, cursive';
      ctx.fillText('♡', spotX + spotW - 5, spotY + 30);

      // Curved hand-drawn arrow pointing down on bottom-right
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      const arrX = spotX + spotW + 15;
      const arrY = spotY + spotH - 30;
      ctx.moveTo(arrX - 20, arrY - 80);
      ctx.quadraticCurveTo(arrX + 35, arrY - 20, arrX - 35, arrY + 40);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(arrX - 50, arrY + 20);
      ctx.lineTo(arrX - 35, arrY + 42);
      ctx.lineTo(arrX - 15, arrY + 30);
      ctx.stroke();
      ctx.restore();

      // 7. Bottom CTA: Torn Paper Note + Neon Link Pill (NO QR CODE!)
      const ctaY = H > 1400 ? H - 340 : H - 260;

      // Yellow Torn Paper Note
      ctx.save();
      ctx.translate(W / 2, ctaY);
      ctx.rotate((-2.2 * Math.PI) / 180);
      ctx.translate(-W / 2, -ctaY);

      const noteW = 480;
      const noteH = 115;
      const noteX = (W - noteW) / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;

      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(noteX, ctaY, noteW, noteH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 40px Caveat, cursive';
      ctx.fillText('Find My Spot on', W / 2, ctaY + 48);

      ctx.font = '900 48px Outfit, sans-serif';
      ctx.fillStyle = '#090A0F';
      ctx.fillText('Spot', W / 2 - 44, ctaY + 96);
      ctx.fillStyle = '#FF2E93';
      ctx.fillText('Pop!', W / 2 + 52, ctaY + 96);
      ctx.restore();

      // Neon Link Pill
      const pillY = ctaY + 145;
      const pillW = 600;
      const pillH = 76;
      const pillX = (W - pillW) / 2;

      ctx.save();
      // Glowing neon border
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 28;
      ctx.fillStyle = 'rgba(9, 10, 15, 0.95)';
      ctx.strokeStyle = '#FF2E93';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 38);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#FBCFE8';
      ctx.fillText(`🔗 ${shortDisplayUrl}`, W / 2, pillY + 49);
      ctx.restore();

      // 8. Download trigger
      const link = document.createElement('a');
      link.download = `spotpop_${spot.slug || spot.id}_${activeFormat}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download render error', err);
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[94vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <div>
              <h3 className="font-outfit font-bold text-lg text-white">Viral Share Kit</h3>
              <p className="text-[11px] text-slate-400">Share your creation to Instagram, WhatsApp & social media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(FORMATS) as ShareFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setActiveFormat(fmt)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFormat === fmt
                  ? 'bg-[#FF2E93] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {FORMATS[fmt].label}
            </button>
          ))}
        </div>

        {/* Visual Live Preview Card (Matching Reference: No QR Code, Viral Story Aesthetic) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-full max-w-[315px] ${FORMATS[activeFormat].aspect} rounded-3xl bg-gradient-to-b from-[#131522] via-[#0A0C14] to-[#040508] border border-white/20 p-5 flex flex-col items-center justify-between text-center shadow-2xl relative overflow-hidden select-none`}
          >
            {/* Ambient sunset & neon corner glows */}
            <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/20 filter blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-tl from-purple-600/35 via-pink-600/25 to-transparent filter blur-2xl pointer-events-none" />

            {/* Subtle paper edge accents top & bottom */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF2E93]/25 to-transparent pointer-events-none" />

            {/* Top Header & Brand */}
            <div className="z-10 pt-1 flex flex-col items-center w-full">
              {/* SP Sticky Note Logo + SpotPop Wordmark */}
              <div className="mb-1">
                <SpotPopLogo variant="full" size={26} />
              </div>

              {/* Expressive Viral Headline */}
              <div className="relative mt-0.5">
                {/* Sparkle rays top right */}
                <span className="absolute -top-1 -right-3 text-amber-300 text-xs font-bold select-none">//</span>
                {/* Star sparkle left */}
                <span className="absolute top-2 -left-3.5 text-white/80 text-[10px] select-none">✦</span>
                <h2 className="font-caveat text-2xl sm:text-[27px] font-black text-white leading-[1.05] tracking-wide -rotate-1">
                  I Claimed My Spot<br />
                  <span className="relative inline-block mt-0.5">
                    on the Internet!
                    <svg className="absolute -bottom-1 left-0 w-full h-2 text-[#FF2E93] overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M 0 5 Q 50 1 100 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </h2>
              </div>
            </div>

            {/* Middle: The User's Actual Spot with Decorative Doodles */}
            <div className="z-10 w-full flex items-center justify-center relative my-auto py-2">
              {/* Paper airplane with dashed trail on left */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-85">
                <span className="text-lg -rotate-45">✈️</span>
                <svg className="w-8 h-10 text-white/50 overflow-visible" viewBox="0 0 30 40" fill="none">
                  <path d="M 15 0 C 0 15, 30 25, 15 40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Floating pink doodle heart on top-right */}
              <div className="absolute right-2 top-1 text-rose-400 text-base font-bold rotate-12 pointer-events-none">
                ♡
              </div>

              {/* Curved pointing arrow on bottom right */}
              <div className="absolute -right-1 bottom-0 pointer-events-none">
                <svg className="w-8 h-10 text-white/85" viewBox="0 0 40 50" fill="none">
                  <path d="M 10 5 Q 35 15, 20 40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 15 35 L 20 42 L 27 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* The Spot Card */}
              <SpotCard
                tier={spot.tier}
                shape={spot.shape}
                background={spot.background}
                borderColor={spot.borderColor}
                content={spot.content}
                creatorName={spot.creatorName}
                rotation={spot.rotation || -1.5}
                width={spot.width}
                height={spot.height}
                scale={spot.tier === 'big_pop' ? 0.68 : 0.82}
              />
            </div>

            {/* Bottom: Torn Paper Callout & Neon Link Pill (NO QR CODE!) */}
            <div className="z-10 flex flex-col items-center gap-2 pb-1 w-full">
              {/* Yellow Torn Paper Note */}
              <div className="px-3.5 py-1 rounded-sm bg-[#FEF08A] text-black shadow-lg -rotate-2 border border-yellow-300 font-caveat text-sm font-black leading-tight flex items-center gap-1.5">
                <span>Find My Spot on</span>
                <span className="font-outfit font-black text-[#FF2E93]">SpotPop!</span>
              </div>

              {/* Neon Pill with Link */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/90 border-2 border-[#FF2E93] text-pink-200 text-[11px] font-mono font-bold shadow-md shadow-pink-500/25 max-w-[95%]">
                <span className="text-pink-400">🔗</span>
                <span className="truncate">{shortDisplayUrl}</span>
              </div>
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="w-full max-w-md p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300 truncate font-mono select-all">
              {publicUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {copiedLink ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-white/10 bg-black/40 grid grid-cols-3 gap-2">
          {/* Download PNG */}
          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingDownload}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isGeneratingDownload ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>💾 Download PNG</span>
            )}
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>💬 WhatsApp</span>
          </button>

          {/* Native Share */}
          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25 cursor-pointer"
          >
            <span>📤 Share Spot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
