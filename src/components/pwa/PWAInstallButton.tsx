import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-xs border border-white/10 active:scale-95 transition-all"
        title="Install SpotPop as Web App"
      >
        <svg className="w-3.5 h-3.5 text-[#FF2E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-xs border border-white/10 active:scale-95 transition-all"
        >
          <span>📲 Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#12141F] border border-white/15 p-6 shadow-2xl text-left">
              <h3 className="text-base font-bold text-white font-outfit">Install SpotPop on iPhone / iPad</h3>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> icon in the bottom Safari bar.<br />
                2. Scroll down and tap <strong className="text-[#FF2E93]">Add to Home Screen</strong>.<br />
                3. Open SpotPop directly from your home screen!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/20 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
