import React, { useState, useRef, useEffect } from 'react';
import { PlanDraft, AudioDraft } from './types';

interface AudioStudioTabProps {
  currentDraft: PlanDraft;
  updateDraft: (updates: Partial<PlanDraft>) => void;
}

export const AudioStudioTab: React.FC<AudioStudioTabProps> = ({
  currentDraft,
  updateDraft,
}) => {
  const [activeMode, setActiveMode] = useState<'voice' | 'music'>('voice');
  const [recordStatus, setRecordStatus] = useState<
    'idle' | 'requesting' | 'recording' | 'denied' | 'unsupported'
  >('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Playback preview state for draft
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  const existingAudio = currentDraft.audioDraft;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Pick best supported MIME type for low-latency Opus/AAC
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    setErrorMsg(null);
    setRecordDuration(0);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordStatus('unsupported');
      setErrorMsg('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      setRecordStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType
        ? { mimeType, audioBitsPerSecond: 32000 }
        : { audioBitsPerSecond: 32000 };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }

        // Immediately stop mic stream to release microphone indicator
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const elapsedSeconds = Math.min(15.0, (Date.now() - recordStartTimeRef.current) / 1000);
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        // Strict Size Check (500 KB limit)
        if (finalBlob.size > 500 * 1024) {
          setErrorMsg(`Recording exceeds 500 KB (${Math.round(finalBlob.size / 1024)} KB). Please record a shorter message.`);
          setRecordStatus('idle');
          return;
        }

        // Minimum audio length check (at least 0.5s)
        if (elapsedSeconds < 0.5) {
          setErrorMsg('Voice note was too short. Tap and speak to record.');
          setRecordStatus('idle');
          return;
        }

        const previewUrl = URL.createObjectURL(finalBlob);
        const newDraft: AudioDraft = {
          blob: finalBlob,
          previewUrl,
          duration: Math.round(elapsedSeconds * 10) / 10,
          mimeType: finalBlob.type || 'audio/webm',
          size: finalBlob.size,
          type: 'voice',
        };

        updateDraft({ audioDraft: newDraft });
        setRecordStatus('idle');
      };

      recorder.start(250);
      recordStartTimeRef.current = Date.now();
      setRecordStatus('recording');

      // Live countdown/elapsed timer (Max 15s)
      recordTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - recordStartTimeRef.current) / 1000;
        if (elapsed >= 15.0) {
          handleStopRecording();
        } else {
          setRecordDuration(elapsed);
        }
      }, 100);
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordStatus('denied');
        setErrorMsg('Microphone access was denied. Please allow microphone permission in your browser settings to record.');
      } else {
        setErrorMsg('Could not access microphone: ' + (err.message || 'Unknown error'));
        setRecordStatus('idle');
      }
    }
  };

  // Stop Voice Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle Music / Original Sound File Selection
  const handleSelectSoundFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict Size Limit: 500 KB
    if (file.size > 500 * 1024) {
      setErrorMsg(`Audio file exceeds 500 KB limit (${Math.round(file.size / 1024)} KB). Please select a shorter or compressed sound.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const tempAudio = new Audio();
    tempAudio.src = objectUrl;

    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration;
      // Strict Duration Limit: 15 seconds
      if (dur > 15.5) {
        setErrorMsg(`Sound clip exceeds 15 seconds limit (${dur.toFixed(1)}s). Please select a sound clip up to 15s.`);
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const newDraft: AudioDraft = {
        blob: file,
        previewUrl: objectUrl,
        duration: Math.round(dur * 10) / 10,
        mimeType: file.type || 'audio/mpeg',
        size: file.size,
        type: 'music',
        filename: file.name,
      };

      updateDraft({ audioDraft: newDraft });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    tempAudio.onerror = () => {
      setErrorMsg('Could not read audio file. Please choose an MP3, M4A, WAV, or WebM file.');
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  // Play / Pause Local Preview
  const togglePlayPreview = () => {
    if (!existingAudio) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(existingAudio.previewUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
          setCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      previewAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  // Remove Audio
  const handleRemoveAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentTime(0);
    updateDraft({ audioDraft: null });
  };

  const formatSecs = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 10);
    return `0:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-200">
      {/* Intro Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-outfit font-bold text-sm text-white flex items-center gap-1.5">
            <span>🎙️</span>
            <span>Audio Memory (Big Pop Exclusive)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Attach an optional voice message or original sound (Max 15s, 500 KB).
          </p>
        </div>
        {existingAudio && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            Attached ✓
          </span>
        )}
      </div>

      {/* Mode Selection Tabs (Voice vs Music) */}
      {!existingAudio && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode('voice')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'voice'
                ? 'bg-gradient-to-r from-[#FF2E93] to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎙️</span>
            <span>Voice Message</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('music')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'music'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎵</span>
            <span>Sound Clip</span>
          </button>
        </div>
      )}

      {/* Error / Alert Banner */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs text-rose-400 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* CASE 1: AUDIO ALREADY ATTACHED -> PLAYBACK & RE-RECORD VIEW */}
      {existingAudio ? (
        <div className="p-4 rounded-2xl bg-[#090A0F] border border-white/15 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#FF2E93]/20 text-[#FF2E93] flex items-center justify-center text-sm">
                {existingAudio.type === 'voice' ? '🎙️' : '🎵'}
              </span>
              <div>
                <div className="text-xs font-bold text-white">
                  {existingAudio.type === 'voice' ? 'Personal Voice Note' : (existingAudio.filename || 'Sound Clip')}
                </div>
                <div className="text-[10px] text-slate-400">
                  {existingAudio.duration.toFixed(1)}s • {Math.round(existingAudio.size / 1024)} KB
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveAudio}
              className="text-xs text-rose-400 hover:text-rose-300 underline transition-colors"
              title="Delete audio"
            >
              Remove
            </button>
          </div>

          {/* Player Bar */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={togglePlayPreview}
              className="w-10 h-10 rounded-full bg-[#FF2E93] hover:bg-[#ff1484] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 transition-all shrink-0"
              title={isPlaying ? 'Pause' : 'Play Preview'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Progress line */}
            <div className="flex-1 space-y-1">
              <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden cursor-pointer">
                <div
                  className="h-full bg-gradient-to-r from-[#FF2E93] to-amber-400 rounded-full transition-all duration-100"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{existingAudio.duration.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Audio will only be uploaded once you confirm and save your Big Pop.
          </div>
        </div>
      ) : activeMode === 'voice' ? (
        /* CASE 2: VOICE RECORDING INTERFACE (WHATSAPP-STYLE SIMPLICITY) */
        <div className="p-6 rounded-2xl bg-[#090A0F] border border-white/15 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          {recordStatus === 'recording' ? (
            <>
              {/* Pulsing Live Recording Visualizer */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/40">
                  <span className="text-3xl">🎙️</span>
                </div>
              </div>

              {/* Live duration & remaining time */}
              <div className="space-y-1">
                <div className="text-2xl font-mono font-black text-rose-400 tracking-tight">
                  {formatSecs(recordDuration)}
                </div>
                <div className="text-xs text-slate-400">
                  Recording... <span className="text-rose-400 font-bold">{(15.0 - recordDuration).toFixed(1)}s</span> left
                </div>
              </div>

              {/* Animated audio waveform bars */}
              <div className="flex items-center gap-1 h-6">
                {[40, 70, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#FF2E93] rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Tap to Stop Button */}
              <button
                type="button"
                onClick={handleStopRecording}
                className="w-full max-w-xs py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-outfit font-bold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="w-3 h-3 rounded-xs bg-white" />
                <span>Tap to Stop & Preview</span>
              </button>
            </>
          ) : (
            <>
              {/* Standby State: Big Tap-to-Record Mic */}
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={recordStatus === 'requesting'}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FF2E93] to-pink-500 hover:scale-105 active:scale-95 text-white flex flex-col items-center justify-center shadow-2xl shadow-pink-500/40 transition-all cursor-pointer group"
                title="Tap to Record Voice Message"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">🎙️</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white/90">
                  {recordStatus === 'requesting' ? 'Allow Mic' : 'Record'}
                </span>
              </button>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">Tap to Record Voice Note</div>
                <p className="text-xs text-slate-400 max-w-xs">
                  Microphone access is requested only when you tap. Max 15 seconds.
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span>⏱️ Max 15 seconds</span>
                <span>•</span>
                <span>🔒 Stored securely</span>
                <span>•</span>
                <span>🚫 No autoplay</span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* CASE 3: ORIGINAL SOUND / MUSIC SELECTION */
        <div className="p-6 rounded-2xl bg-[#090A0F] border border-white/15 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
            onChange={handleSelectSoundFile}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm p-6 border-2 border-dashed border-white/20 hover:border-purple-400 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎵
            </div>
            <div className="text-xs font-bold text-white">Choose Audio File from Device</div>
            <div className="text-[11px] text-slate-400">
              MP3, M4A, WAV, or WebM • Max 15s • Max 500 KB
            </div>
            <span className="mt-2 px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-md">
              Browse Sound
            </span>
          </div>

          <div className="text-[11px] text-slate-500 max-w-xs">
            Only upload original sounds or music you have the right to share. Strictly limited to 15s.
          </div>
        </div>
      )}
    </div>
  );
};

