# CryptoFolio

A multi-chain crypto portfolio tracker with candlestick charts, trade history, and FX impact analysis. Built with React, TypeScript, and a warm solarized theme.

## Features

- **Multi-chain wallet support** -- Connect via Rabby, MetaMask, or any WalletConnect-compatible wallet. Tracks tokens across Ethereum, Arbitrum, Polygon, and BSC.
- **Candlestick price charts** -- Interactive charts powered by Lightweight Charts with time ranges from 1D (30-min candles) to 1Y (daily candles).
- **Trade history with FX tracking** -- Displays buy/sell history enriched with historical USD prices and SGD conversion rates, including cumulative FX impact.
- **Smart chart navigation** -- Clicking a trade in the table shifts the chart window to that date while preserving the selected candle granularity. Trades within the current view are highlighted without recentering.
- **Demo mode** -- Append `?demo=true` to the URL for a fully functional demo with realistic mock data across all tokens and time ranges. No wallet or API keys required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | Lightweight Charts v5 |
| Wallet | RainbowKit + wagmi + viem |
| Data | React Query with persistent caching |
| Prices | CoinGecko API |
| Balances & Transfers | Moralis Web3 API |
| FX Rates | Frankfurter API |
| Testing | Vitest + Testing Library |
| Build | Vite 8 |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Moralis](https://moralis.io/) API key (free tier works)
- A [WalletConnect](https://cloud.walletconnect.com/) project ID
- Optionally, a [CoinGecko](https://www.coingecko.com/en/api) demo API key (reduces rate limiting)

### Setup

```bash
git clone git@github.com:catzhead/cryptofolio.git
cd cryptofolio
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

Open http://localhost:5173 (or http://localhost:5173/?demo=true for demo mode).

### Running Tests

```bash
npm test          # watch mode
npm run test:run  # single run
```

### Building for Production

```bash
npm run build
npm run preview
```

A `Containerfile` is included for container-based deployments with nginx.

## Architecture

```
src/
  components/     UI components (chart, table, dropdowns, etc.)
  hooks/          React Query hooks for data fetching
  lib/            API clients (Moralis, CoinGecko, Frankfurter) and mock data
  types.ts        Shared TypeScript types
```

**Data flow:** Wallet connection (wagmi) -> token balances (Moralis) -> price charts (CoinGecko OHLC) and trade history (Moralis transfers + CoinGecko historical prices + Frankfurter FX rates).

For demo mode, all data is generated deterministically from seeded PRNGs, producing realistic price movements unique to each token.

## Built With Claude

This project was built entirely through pair programming with [Claude Code](https://claude.ai/claude-code) (Claude Opus 4.6) by Anthropic. From initial scaffold to the final solarized theme, every feature, bug fix, and test was developed collaboratively in conversation.

## License

MIT
