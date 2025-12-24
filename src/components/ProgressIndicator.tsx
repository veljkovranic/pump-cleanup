/**
 * ProgressIndicator Component
 * 
 * Shows the current progress of the reclaim operation.
 */

import React from 'react';
import { ReclaimProgress } from '@/hooks/usePumpCleanup';

interface ProgressIndicatorProps {
  progress: ReclaimProgress;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'preparing':
        return (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'awaiting_signature':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'submitting':
        return (
          <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'confirming':
        return (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-cleanup-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'partial_success':
        return (
          <svg className="w-6 h-6 text-cleanup-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-cleanup-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'success':
        return 'bg-cleanup-secondary';
      case 'partial_success':
        return 'bg-cleanup-warning';
      case 'error':
        return 'bg-cleanup-error';
      default:
        return 'bg-gradient-to-r from-cleanup-primary to-cleanup-secondary';
    }
  };

  return (
    <div className="bg-cleanup-card border border-cleanup-border rounded-2xl p-6 mb-6">
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-cleanup-primary/10 flex items-center justify-center text-cleanup-primary">
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white font-display">
            {progress.status === 'awaiting_signature' ? 'Waiting for Signature' : 'Processing'}
          </h3>
          <p className="text-sm text-cleanup-text-secondary">{progress.message}</p>
        </div>
        <span className="text-2xl font-bold text-cleanup-primary font-display">
          {progress.percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-cleanup-dark rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${getStatusColor()}`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Transaction Counter */}
      {progress.totalTx > 0 && (
        <div className="mt-4 flex justify-between text-xs text-cleanup-text-muted">
          <span>
            Transaction {progress.currentTx} of {progress.totalTx}
          </span>
          <span className="text-cleanup-secondary animate-pulse">
            Processing...
          </span>
        </div>
      )}

      {/* Wallet signature reminder */}
      {progress.status === 'awaiting_signature' && (
        <div className="mt-4 bg-cleanup-warning/10 border border-cleanup-warning/30 rounded-xl p-4">
          <p className="text-sm text-cleanup-warning flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Please check your wallet extension to sign the transaction
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
