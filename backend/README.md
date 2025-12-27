# PumpCleanup Backend API

Simple Express.js backend that caches recent cleanup transactions from the Solana blockchain.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables:
- `PORT` - API server port (default: 3001)
- `RPC_ENDPOINT` - Solana RPC endpoint
- `FEE_WALLET` - Fee wallet address to track
- `CACHE_TTL_MS` - Cache TTL in milliseconds (default: 120000)
- `CORS_ORIGIN` - Frontend URL for CORS

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### GET /health
Health check endpoint.

### GET /api/recent-cleanups
Returns cached recent cleanup transactions.

### GET /api/stats
Returns summary statistics.

