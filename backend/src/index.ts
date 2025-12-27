/**
 * PumpCleanup Backend API
 * 
 * Simple Express server that caches recent cleanup transactions
 * to reduce RPC load and improve frontend performance.
 * 
 * Uses lazy loading - only fetches from RPC when endpoints are called.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { recentCleanupsRouter } from './routes/recentCleanups';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', recentCleanupsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`[PumpCleanup API] Server running on port ${PORT}`);
  console.log(`[PumpCleanup API] CORS origin: ${CORS_ORIGIN}`);
  console.log(`[PumpCleanup API] Cache is lazy-loaded on first request`);
});

