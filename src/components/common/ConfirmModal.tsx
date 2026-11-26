import React, { useEffect } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  warningBadge?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  warningBadge,
  icon,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, isLoading]);

  if (!isOpen) return null;

  const defaultIcon = danger ? '⚠️' : 'ℹ️';
  const displayIcon = icon || defaultIcon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#141724] to-[#0A0C14] border shadow-2xl p-6 space-y-5 transition-all transform scale-100 ${
          danger
            ? 'border-rose-500/40 shadow-rose-950/50'
            : 'border-white/15 shadow-black/80'
        }`}
      >
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner ${
              danger
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-white/10 text-white border border-white/10'
            }`}
          >
            {displayIcon}
          </div>
          <div className="space-y-1 min-w-0">
            <h3
              id="confirm-modal-title"
              className="text-base font-bold text-white tracking-tight leading-snug font-outfit truncate"
            >
              {title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        {/* Optional Warning Alert Badge */}
        {(warningBadge || danger) && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-300">
            <span className="text-sm shrink-0">🛡️</span>
            <span className="font-medium leading-snug">
              {warningBadge || 'This action is permanent and cannot be undone.'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
              danger
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                : 'bg-gradient-to-r from-[#FF2E93] to-purple-600 hover:brightness-110 shadow-pink-500/30'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
