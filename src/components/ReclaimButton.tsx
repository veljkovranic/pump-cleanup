/**
 * ReclaimButton Component
 * 
 * The main CTA button to close accounts and reclaim SOL.
 * Clean, professional design with subtle animations.
 */

import React from 'react';

interface ReclaimButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  solAmount: number;
  label?: string;
}

export const ReclaimButton: React.FC<ReclaimButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  solAmount,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full py-4 sm:py-5 rounded-xl font-display text-base sm:text-lg font-bold
        transition-all duration-300 transform
        ${disabled
          ? 'bg-cleanup-border text-cleanup-text-muted cursor-not-allowed'
          : 'bg-gradient-to-r from-cleanup-primary to-cleanup-secondary text-white hover:opacity-90 active:scale-[0.99] shadow-lg shadow-cleanup-primary/20'
        }
        overflow-hidden
      `}
    >
      {/* Animated shimmer effect */}
      {!disabled && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      )}

      <span className="relative flex items-center justify-center gap-2 sm:gap-3">
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Reclaim {solAmount.toFixed(4)} SOL</span>
          </>
        )}
      </span>
    </button>
  );
};

export default ReclaimButton;
