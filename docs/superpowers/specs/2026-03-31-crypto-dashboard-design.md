# Crypto Wallet Dashboard — Design Spec

## Overview

A personal portfolio dashboard that connects to a Rabby wallet (which also manages a OneKey Pro hardware wallet) and provides:

1. An interactive candlestick price chart with buy/sell markers for any held token
2. A trade history table with USD values and USD/SGD exchange rate impact analysis

The app is a responsive web SPA that works on Mac (browser), iPhone, and iPad. It will be hosted on a VPS as a static site — no server-side storage. All caching and data persistence happens client-side in the browser (IndexedDB/localStorage).

## Tech Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — responsive design
- **Lightweight Charts** (TradingView open-source) — candlestick charts with crosshair, pan/zoom, markers
- **wagmi v2 + RainbowKit** — wallet connection (Rabby injects as EIP-1193 provider)
- **TanStack Query** — data fetching, caching, retry logic
- **viem** — EVM utilities
- **Vitest + React Testing Library** — testing

## Data Sources

| Data | Source | Free Tier |
|------|--------|-----------|
| Token balances (per chain) | Moralis API | 40k req/month |
| Transaction history | Moralis API (`getWalletTokenTransfers`) | included |
| OHLC price data | CoinGecko API | 10-30 req/min |
| Historical USD/SGD rates | exchangerate.host or Frankfurt API | unlimited, no key |
| Current USD/SGD rate | same as above | same |

## Supported Chains (Phase 1: EVM)

Ethereum, Arbitrum, Polygon, BSC. Bitcoin support planned for Phase 2.

## Layout

Single-page layout, vertically stacked:

1. **Header** — app name, Connect Wallet button (or connected address)
2. **Portfolio summary** — total portfolio value in USD, 24h change percentage
3. **Token dropdown** — compact dropdown selector showing current token name, chain, balance, and USD value. Opens to reveal full list. Each token is chain-specific (e.g. "WBTC (Ethereum)", "USDC (Arbitrum)").
4. **Price chart** — candlestick chart for the selected token
5. **Trade history table** — all trades for the selected token on the selected chain

## Price Chart

### Features

- **Candlestick chart** via Lightweight Charts
- **Time range pills**: 1m, 5m, 15m, 1H, 4H, 1D, 1W, 1M, 1Y, 5Y, ALL
- **Crosshair cursor** — vertical + horizontal dashed lines following the mouse/touch, showing date on x-axis and price on y-axis
- **Pan and zoom** — drag to pan, scroll/pinch to zoom (built into Lightweight Charts)
- **Buy/Sell markers** — triangles overlaid on the chart at the price and time of each trade:
  - Buy: green upward triangle with "BUY {amount}" and price label
  - Sell: red downward triangle with "SELL {amount}" and price label
- **Volume bar** — subtle volume indicator below the chart

### Data

- OHLC candle data fetched from CoinGecko `/coins/{id}/ohlc` endpoint
- Candle granularity maps to CoinGecko's available intervals
- For tokens without OHLC data, fall back to line chart using simple price history, or show "Price data unavailable"

## Trade History Table

### Columns

| Column | Description |
|--------|-------------|
| Date & Time | Full timestamp of the trade |
| Type | Buy (green) or Sell (red) — classified by transfer direction relative to user's address |
| Amount | Quantity of the token traded |
| USD Value | Token amount × token USD price at trade timestamp (price from CoinGecko historical data) |
| SGD (then) | USD value converted at the USD/SGD exchange rate on the trade date |
| SGD (now) | Same USD value converted at today's USD/SGD exchange rate |
| FX Impact | Difference between SGD (then) and SGD (now). Green if USD strengthened vs SGD, red if weakened. |

### Running Totals

The Amount, USD Value, SGD (then), SGD (now), and FX Impact columns each show two lines:
- **Top line**: the trade's own value (normal color)
- **Bottom line**: cumulative running total in dimmed text (e.g. "Total: 1.3")

This avoids extra columns while giving a clear picture of portfolio progression over time. The Date & Time column shows date and time on a single line (e.g. "2025-06-03 14:32") — no second line.

### Chart ↔ Table Linked Selection

Clicking a trade in either the chart or the table selects it in both views:

- **Click a table row** → the row highlights, and the chart smoothly pans/zooms to center on that trade's marker (using Lightweight Charts' `scrollToTimestamp` API). The marker gets a highlight effect.
- **Click a chart marker** → the chart marker highlights, and the page smooth-scrolls to the corresponding table row which gets a highlight effect.
- Highlight fades after a few seconds or when another trade is selected.

**Keyboard navigation** (when a trade is selected):
- **Left / Up** — select previous trade (older)
- **Right / Down** — select next trade (newer)
- **End** — jump to most recent trade
- Each key press triggers the same linked selection behavior (chart pans, table scrolls, highlight).

### Footer

Summary row showing:
- Current holdings (token amount)
- Current value in USD
- Total FX impact across all trades

## Data Flow

### Wallet Connection

1. User clicks "Connect Wallet" → RainbowKit modal → selects Rabby
2. wagmi provides connected addresses
3. App queries Moralis `getTokenBalances` for each address across all supported EVM chains
4. Token list populates the dropdown (each token scoped to its chain)

### Token Selection

1. User selects a token from the dropdown
2. Fetch OHLC candle data from CoinGecko for the selected time range
3. Fetch transaction history from Moralis (`getWalletTokenTransfers`) filtered to that token + chain
4. For each trade, fetch historical USD/SGD rate for that date
5. Fetch today's USD/SGD rate (cached)
6. Render chart with candles + buy/sell markers
7. Populate trade table with FX calculations

### Caching & Client-Side Persistence

The VPS serves only static files (HTML/JS/CSS). All data is fetched client-side and cached in the browser. No data is stored on the server.

**In-memory cache (TanStack Query):**

| Data | Cache Strategy |
|------|---------------|
| Token balances | Refetch every 60 seconds |
| Price data (OHLC) | Cache per token + time range, refetch on range change |
| Transaction history | Cache per token + chain, rarely changes |
| Historical FX rates | Cache per date (never changes) |
| Current FX rate | Refetch every hour |

**Persistent cache (IndexedDB via idb-keyval or similar):**

TanStack Query's `persistQueryClient` plugin syncs the query cache to IndexedDB. This means:
- Closing and reopening the browser restores cached data instantly (no re-fetching)
- Historical FX rates and old transaction history persist indefinitely (they never change)
- Fresh data is still fetched in the background per the stale times above
- Each device maintains its own local cache

## Component Structure

```
src/
  components/
    ConnectButton.tsx         — RainbowKit wallet connect
    ConnectButton.test.tsx
    TokenDropdown.tsx          — token selector with chain, balance, value
    TokenDropdown.test.tsx
    PriceChart.tsx             — Lightweight Charts candlestick + markers
    PriceChart.test.tsx
    TimeRangeBar.tsx           — candle interval pills (1m → ALL)
    TimeRangeBar.test.tsx
    TradeTable.tsx             — trade history with FX columns
    TradeTable.test.tsx
    PortfolioHeader.tsx        — total portfolio value + 24h change
    PortfolioHeader.test.tsx
  hooks/
    useTokenBalances.ts        — fetch balances via Moralis
    useTokenBalances.test.ts
    useOHLC.ts                 — fetch candle data via CoinGecko
    useOHLC.test.ts
    useTradeHistory.ts         — fetch token transfers via Moralis
    useTradeHistory.test.ts
    useFXRate.ts               — fetch historical + current USD/SGD
    useFXRate.test.ts
  lib/
    wagmiConfig.ts             — wagmi + RainbowKit chain config
    moralis.ts                 — Moralis API client
    moralis.test.ts
    coingecko.ts               — CoinGecko API client
    coingecko.test.ts
    fx.ts                      — FX rate API client
    fx.test.ts
  App.tsx                      — main layout: header → dropdown → chart → table
```

Tests are co-located next to source files (Vitest convention).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Wallet not connected | Landing state with "Connect Wallet" button, no chart or table |
| No tokens found | Message: "No tokens found for this wallet" |
| API rate limits (CoinGecko) | TanStack Query retries with exponential backoff. Subtle toast notification if rate-limited. |
| Missing OHLC data | Fall back to line chart using simple price history, or show "Price data unavailable" |
| Missing FX rate for a date | Use the closest available date's rate |
| Transaction classification | Moralis returns raw transfers. Classify as Buy (token received) or Sell (token sent) based on transfer direction relative to user's address |

## Scope

### In scope (Phase 1)
- EVM chains: Ethereum, Arbitrum, Polygon, BSC
- Rabby wallet connection (covers OneKey Pro as signer)
- Candlestick chart with all standard intervals and buy/sell markers
- Trade history table with USD/SGD FX impact
- Responsive design for Mac/iPhone/iPad browsers

### Deployment

- Built as a static SPA (`vite build` → `dist/` folder)
- Packaged in a single OCI container (nginx:alpine serving the static files), built and run with Podman
- Containerfile: multi-stage build (Node for `vite build`, then copy `dist/` into nginx:alpine)
- No server-side logic, no database, no storage on the VPS
- API keys (CoinGecko, Moralis) are embedded in the client — acceptable since they are free-tier read-only keys for a personal tool

### Out of scope (future)
- Bitcoin chain support (Phase 2)
- Native mobile apps
- Server-side logic or storage
- Tax reporting or cost basis calculations
- Real-time WebSocket price updates (polling is sufficient for personal use)
- Portfolio performance over time charts
