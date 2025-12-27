/**
 * Recent Cleanups API Route
 * 
 * Exposes cached cleanup transaction data to the frontend.
 * Uses lazy loading - only fetches from RPC when endpoint is called.
 */

import { Router } from 'express';
import { getCachedData, getCachedDataAsync } from '../services/cleanupCache';

export const recentCleanupsRouter = Router();

/**
 * GET /api/recent-cleanups
 * 
 * Returns cached recent cleanup transactions.
 * Fetches fresh data if cache is stale (lazy loading).
 */
recentCleanupsRouter.get('/recent-cleanups', async (req, res) => {
  try {
    // Get data, refreshing if stale (async, waits for fresh data)
    const data = await getCachedDataAsync();

    res.json({
      success: true,
      data: {
        payouts: data.payouts,
        totalSolReclaimed: data.totalSolReclaimed,
        lastUpdated: data.lastUpdated,
      },
    });
  } catch (error) {
    console.error('[PumpCleanup API] Error in /recent-cleanups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent cleanups',
    });
  }
});

/**
 * GET /api/stats
 * 
 * Returns summary statistics (uses current cache, doesn't wait for refresh).
 */
recentCleanupsRouter.get('/stats', (req, res) => {
  const data = getCachedData();

  res.json({
    success: true,
    data: {
      totalSolReclaimed: data.totalSolReclaimed,
      recentCleanupCount: data.payouts.length,
      lastUpdated: data.lastUpdated,
    },
  });
});

