# Wallet Cleanup

Reclaim hidden SOL locked in empty token accounts on Solana.

## Overview

Every token transaction on Solana creates token accounts that lock ~0.002 SOL as rent. When you sell or transfer tokens, the empty accounts remain with your SOL still locked. Wallet Cleanup helps you close these accounts and recover your SOL.

## Features

- 🔍 **Deep Scanning** - Scans both new and old (2022) SPL Token Programs
- 💰 **SOL Recovery** - Close empty accounts and get your rent back
- 🔒 **Secure** - Only closes accounts with zero balance
- ⚡ **Instant** - Transactions processed immediately
- 📊 **Transparent** - 10% service fee, no upfront costs

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
cp env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_RPC_ENDPOINT` - Your Solana RPC endpoint
- `NEXT_PUBLIC_FEE_WALLET` - Fee collection wallet address

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js, SPL Token
- **Wallet**: Solana Wallet Adapter

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and constants
├── pages/          # Next.js pages
└── styles/         # Global styles
```

## License

MIT
