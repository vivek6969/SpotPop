import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Spot } from '../../types';
import { api } from '../../services/api';
import { SpotCard } from '../canvas/SpotCard';

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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate public link
  const publicUrl = `${window.location.origin}?spot=${spot.slug || spot.id}`;

  // Generate QR Code on mount
  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [publicUrl]);

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
          text: `Check out my spot on the public SpotPop canvas! #SpotPop`,
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

  // Download high-resolution PNG rendering
  const handleDownloadImage = async () => {
    setIsGeneratingDownload(true);
    trackShare();

    try {
      const cfg = FORMATS[activeFormat];
      const canvas = document.createElement('canvas');
      canvas.width = cfg.width;
      canvas.height = cfg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cfg.height);
      bgGrad.addColorStop(0, '#0E1017');
      bgGrad.addColorStop(0.5, '#161926');
      bgGrad.addColorStop(1, '#090A0F');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cfg.width, cfg.height);

      // Pink & gold glowing orbs
      const glowGrad = ctx.createRadialGradient(
        cfg.width / 2, cfg.height / 2, 50,
        cfg.width / 2, cfg.height / 2, cfg.width * 0.7
      );
      glowGrad.addColorStop(0, 'rgba(255, 46, 147, 0.25)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, cfg.width, cfg.height);

      // Header Branding: SpotPop
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Spot', cfg.width / 2 - 60, cfg.height > 1200 ? 220 : 160);

      ctx.fillStyle = '#FF2E93';
      ctx.fillText('Pop', cfg.width / 2 + 70, cfg.height > 1200 ? 220 : 160);

      // Tagline
      ctx.fillStyle = '#94A3B8';
      ctx.font = '32px Plus Jakarta Sans, sans-serif';
      ctx.fillText('CLAIM YOUR SPOT ON THE INTERNET', cfg.width / 2, cfg.height > 1200 ? 280 : 210);

      // Draw the Spot in the Center
      const spotW = 540;
      const spotH = spot.tier === 'big_pop' ? 640 : 480;
      const spotX = (cfg.width - spotW) / 2;
      const spotY = (cfg.height - spotH) / 2 - (cfg.height > 1200 ? 40 : 20);

      // Spot card background
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      ctx.fillStyle = spot.shape === 'polaroid' ? '#FFFFFF' : spot.background || '#FEF08A';
      ctx.beginPath();
      ctx.roundRect(spotX, spotY, spotW, spotH, 16);
      ctx.fill();
      ctx.restore();

      // Spot text content
      ctx.fillStyle = spot.content.textColor || '#1E293B';
      ctx.textAlign = 'center';
      ctx.font = 'bold 44px Caveat, cursive';
      ctx.fillText(spot.content.headline || spot.creatorName, cfg.width / 2, spotY + (spot.tier === 'big_pop' ? 560 : 220));

      if (spot.content.text) {
        ctx.font = '32px Caveat, cursive';
        ctx.fillStyle = spot.content.textColor || '#475569';
        ctx.fillText(spot.content.text, cfg.width / 2, spotY + (spot.tier === 'big_pop' ? 605 : 280));
      }

      // If photo exists, render photo
      if (spot.content.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          img.src = spot.content.imageUrl!;
        });
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, spotX + 24, spotY + 24, spotW - 48, spotW - 48);
        }
      }

      // If drawing exists, render drawing layer
      if (spot.content.drawingData) {
        const drawImg = new Image();
        drawImg.crossOrigin = 'anonymous';
        await new Promise((res) => {
          drawImg.onload = res;
          drawImg.onerror = res;
          drawImg.src = spot.content.drawingData!;
        });
        if (drawImg.complete && drawImg.naturalWidth > 0) {
          ctx.drawImage(drawImg, spotX + 24, spotY + 24, spotW - 48, spotW - 48);
        }
      }

      // Render stickers on canvas export
      if (spot.content.stickers && spot.content.stickers.length > 0) {
        ctx.save();
        for (const stk of spot.content.stickers) {
          ctx.font = `${Math.round(stk.size * 2)}px sans-serif`;
          ctx.fillText(stk.emojiOrIcon, spotX + stk.x * 2.2, spotY + stk.y * 2.2 + 25);
        }
        ctx.restore();
      }

      // Footer: Creator Claim statement & QR Code
      const qrSize = cfg.height > 1200 ? 160 : 130;
      const footerY = cfg.height - (cfg.height > 1200 ? 320 : 220);

      if (qrCodeDataUrl) {
        const qrImg = new Image();
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.src = qrCodeDataUrl;
        });
        ctx.drawImage(qrImg, (cfg.width - qrSize) / 2, footerY, qrSize, qrSize);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`“I claimed my spot on spotpop.in”`, cfg.width / 2, footerY + qrSize + 48);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '26px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`By @${spot.creatorName} · Spot #${spot.slug}`, cfg.width / 2, footerY + qrSize + 88);

      // Download trigger
      const link = document.createElement('a');
      link.download = `spotpop_${spot.slug}_${activeFormat}.png`;
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
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
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
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
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
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFormat === fmt
                  ? 'bg-[#FF2E93] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {FORMATS[fmt].label}
            </button>
          ))}
        </div>

        {/* Visual Live Preview Card */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-full max-w-[280px] ${FORMATS[activeFormat].aspect} rounded-2xl bg-gradient-to-b from-[#181A26] to-[#0A0B10] border border-white/15 p-4 flex flex-col items-center justify-between text-center shadow-2xl relative overflow-hidden`}
          >
            {/* Ambient glow */}
            <div className="absolute top-1/4 w-40 h-40 rounded-full bg-[#FF2E93]/20 filter blur-2xl pointer-events-none" />

            {/* Header: SpotPop */}
            <div className="z-10 pt-1">
              <div className="flex items-center justify-center gap-1 font-outfit text-lg font-black leading-none">
                <span className="text-white">Spot</span>
                <span className="text-[#FF2E93]">Pop</span>
              </div>
              <p className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5">
                Claim your spot on the internet
              </p>
            </div>

            {/* Middle: The User's Actual Spot */}
            <div className="z-10 w-full flex items-center justify-center py-2 overflow-visible">
              <SpotCard
                tier={spot.tier}
                shape={spot.shape}
                background={spot.background}
                borderColor={spot.borderColor}
                content={spot.content}
                creatorName={spot.creatorName}
                rotation={spot.rotation || -1}
                width={spot.width}
                height={spot.height}
                scale={spot.tier === 'big_pop' ? 0.6 : 0.78}
              />
            </div>

            {/* Bottom: QR Code & Viral Quote */}
            <div className="z-10 flex flex-col items-center gap-1 pb-1">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-16 h-16 rounded-lg p-1 bg-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/20 animate-pulse" />
              )}
              <div className="text-[11px] font-bold text-white mt-1">
                “I claimed my spot on SpotPop”
              </div>
              <div className="text-[9px] text-slate-400">
                scan to visit on canvas
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
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
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
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>💬 WhatsApp</span>
          </button>

          {/* Native Share */}
          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#E6007A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25"
          >
            <span>📤 Share Spot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
