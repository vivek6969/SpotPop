import React, { useState, useRef, useEffect } from 'react';
import { SpotAudio } from '../../types';

interface SpotAudioPlayerProps {
  audio: SpotAudio;
  creatorName?: string;
  className?: string;
}

// Global reference ensuring only one audio clip plays across the entire app at any time
let globalAudioInstance: HTMLAudioElement | null = null;

export const SpotAudioPlayer: React.FC<SpotAudioPlayerProps> = ({
  audio,
  creatorName,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Stop audio immediately when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (globalAudioInstance === audioRef.current) {
          globalAudioInstance = null;
        }
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = () => {
    setError(null);

    // Audio is lazy-loaded ONLY after visitor taps Play
    if (!audioRef.current) {
      const el = new Audio(audio.url);
      el.preload = 'none'; // NEVER preload or download audio before user interaction

      el.ontimeupdate = () => {
        if (el.duration && !isNaN(el.duration)) {
          setProgress((el.currentTime / el.duration) * 100);
          setCurrentTime(el.currentTime);
        }
      };

      el.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };

      el.onerror = () => {
        setError('Could not load audio. Check connection.');
        setIsPlaying(false);
      };

      audioRef.current = el;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Stop any other active audio playing in the browser
      if (globalAudioInstance && globalAudioInstance !== audioRef.current) {
        globalAudioInstance.pause();
      }
      globalAudioInstance = audioRef.current;

      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
        setError('Playback restricted by browser.');
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * (audioRef.current.duration || audio.duration);
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(clickRatio * 100);
  };

  const formatSecs = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 10);
    return `0:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const isVoice = audio.type === 'voice';

  return (
    <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-[#12141F] to-[#1A1829] border border-white/15 shadow-xl select-none ${className}`}>
      {/* Header pill */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
          <span>{isVoice ? '🎙️ Personal Voice Message' : '🎵 Original Sound Clip'}</span>
          {creatorName && (
            <span className="text-[11px] text-slate-400 font-normal">by {creatorName}</span>
          )}
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
          {audio.duration.toFixed(1)}s
        </span>
      </div>

      {error ? (
        <div className="text-xs text-rose-400 py-1 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[10px] underline hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-[#FF2E93] to-pink-600 hover:opacity-95 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 transition-all shrink-0 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play Sound'}
            aria-label={isPlaying ? 'Pause sound' : 'Play sound'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Interactive Progress Bar & Waveform Visualization */}
          <div className="flex-1 space-y-1.5">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="relative w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden cursor-pointer group"
              title="Click to seek"
            >
              {/* Animated progress fill */}
              <div
                className="h-full bg-gradient-to-r from-[#FF2E93] via-pink-400 to-amber-300 rounded-full transition-all duration-75 relative"
                style={{ width: `${progress}%` }}
              >
                {/* Scrub head */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Time labels & live equalizers */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="font-bold text-white/90">
                {formatSecs(currentTime)}
              </span>

              {/* Animated sound wave bars when active */}
              {isPlaying && (
                <div className="flex items-center gap-0.5 h-3">
                  {[40, 90, 60, 100, 75, 45, 85].map((h, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-[#FF2E93] rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              <span>{formatSecs(audio.duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

