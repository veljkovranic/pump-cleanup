/**
 * SessionStats Component
 * 
 * Displays statistics for the current session.
 */

import React from 'react';
import { SessionStats as SessionStatsType } from '@/hooks/usePumpCleanup';

interface SessionStatsProps {
  stats: SessionStatsType;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ stats }) => {
  return (
    <div className="mt-8 bg-cleanup-card border border-cleanup-border rounded-2xl p-6">
      <h3 className="text-sm text-cleanup-text-muted mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Session Statistics
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-cleanup-secondary font-display">
            {stats.totalSolReclaimed.toFixed(4)}
          </p>
          <p className="text-xs text-cleanup-text-muted mt-1">SOL Reclaimed</p>
        </div>
        
        <div className="text-center border-x border-cleanup-border">
          <p className="text-2xl md:text-3xl font-bold text-white font-display">
            {stats.totalAccountsClosed}
          </p>
          <p className="text-xs text-cleanup-text-muted mt-1">Accounts Closed</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-cleanup-primary font-display">
            {stats.reclaimCount}
          </p>
          <p className="text-xs text-cleanup-text-muted mt-1">Transactions</p>
        </div>
      </div>
    </div>
  );
};

export default SessionStats;
