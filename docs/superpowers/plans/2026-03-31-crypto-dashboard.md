# Crypto Wallet Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal crypto portfolio dashboard SPA that connects to Rabby wallet, shows candlestick price charts with buy/sell markers, and displays trade history with USD/SGD FX impact analysis.

**Architecture:** Vite + React 18 SPA with no backend. Wallet connection via wagmi/RainbowKit, data from Moralis (balances/transfers), CoinGecko (prices/OHLC), and Frankfurter (FX rates). TanStack Query for caching with IndexedDB persistence. Deployed as a Podman container (nginx:alpine).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, lightweight-charts, wagmi v2, RainbowKit, TanStack Query v5, viem, idb-keyval, Vitest, React Testing Library

**Note on CoinGecko free tier OHLC granularity:** The free tier limits candle granularity based on the `days` param: 30min candles for 1-2 days, 4h for 3-30 days, 4-day candles for 31+. The time range pills (1m, 5m, 15m, etc.) will map to the best available granularity — some sub-hourly intervals won't produce true per-minute candles on the free tier. This is acceptable for a personal portfolio tracker.

---

## File Structure

```
crypto/
  src/
    main.tsx                    — App entry, providers (WagmiProvider, PersistQueryClientProvider, RainbowKitProvider)
    App.tsx                     — Main layout: header → dropdown → chart → table
    wagmiConfig.ts              — wagmi + RainbowKit chain config
    queryClient.ts              — TanStack Query client + IndexedDB persister setup
    types.ts                    — Shared types (TokenBalance, Trade, TimeRange, etc.)
    components/
      ConnectButton.tsx         — RainbowKit wallet connect wrapper
      ConnectButton.test.tsx
      PortfolioHeader.tsx       — Total portfolio value + 24h change
      PortfolioHeader.test.tsx
      TokenDropdown.tsx         — Token selector with chain, balance, value
      TokenDropdown.test.tsx
      TimeRangeBar.tsx          — Candle interval pills
      TimeRangeBar.test.tsx
      PriceChart.tsx            — Lightweight Charts candlestick + markers
      PriceChart.test.tsx
      TradeTable.tsx            — Trade history with FX columns + running totals
      TradeTable.test.tsx
    hooks/
      useTokenBalances.ts       — Fetch balances via Moralis across chains
      useTokenBalances.test.ts
      useOHLC.ts                — Fetch candle data via CoinGecko
      useOHLC.test.ts
      useTradeHistory.ts        — Fetch token transfers via Moralis
      useTradeHistory.test.ts
      useFXRate.ts              — Fetch historical + current USD/SGD
      useFXRate.test.ts
      useTradeSelection.ts      — Shared state for chart ↔ table linked selection
      useTradeSelection.test.ts
    lib/
      moralis.ts                — Moralis API client
      moralis.test.ts
      coingecko.ts              — CoinGecko API client
      coingecko.test.ts
      fx.ts                     — Frankfurter FX rate API client
      fx.test.ts
      chains.ts                 — Chain config constants (id, name, moralis chain param, coingecko platform)
  index.html
  tailwind.config.ts
  vite.config.ts
  vitest.config.ts
  tsconfig.json
  tsconfig.node.json
  Containerfile
  .env.example
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.example`, `postcss.config.js`

- [ ] **Step 1: Scaffold Vite project**

Run:
```bash
cd /Users/adrienbarbot/Workspace/claude/crypto
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, choose to overwrite/continue. Expected: creates `package.json`, `vite.config.ts`, `tsconfig.json`, etc.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install wagmi viem @tanstack/react-query @rainbow-me/rainbowkit lightweight-charts tailwindcss @tailwindcss/vite idb-keyval @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

- [ ] **Step 3: Install dev dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

- [ ] **Step 4: Configure Tailwind**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Add to `tsconfig.json` compilerOptions:

```json
"types": ["vitest/globals"]
```

- [ ] **Step 6: Create .env.example**

Create `.env.example`:

```
VITE_MORALIS_API_KEY=your_moralis_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

Add `.env` to `.gitignore`.

- [ ] **Step 7: Add test script to package.json**

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 8: Verify setup**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <div className="min-h-screen bg-gray-950 text-white p-4">CryptoFolio</div>
}
```

Replace `src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Run: `npm run dev`
Expected: App starts on localhost, shows "CryptoFolio" on dark background.

Run: `npx vitest run`
Expected: Vitest runs (no tests yet, but no config errors).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project with Tailwind and Vitest"
```

---

### Task 2: Shared Types and Chain Config

**Files:**
- Create: `src/types.ts`, `src/lib/chains.ts`

- [ ] **Step 1: Create shared types**

Create `src/types.ts`:

```ts
export interface TokenBalance {
  tokenAddress: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balanceFormatted: string
  usdPrice: number
  usdValue: number
  usdPrice24hrPercentChange: number
  chain: ChainKey
  logo?: string
}

export type ChainKey = 'ethereum' | 'arbitrum' | 'polygon' | 'bsc'

export interface Trade {
  transactionHash: string
  blockTimestamp: string
  fromAddress: string
  toAddress: string
  value: string
  valueFormatted: number
  tokenSymbol: string
  tokenDecimals: number
  type: 'buy' | 'sell'
  usdValue?: number
  sgdThen?: number
  sgdNow?: number
  fxImpact?: number
}

export interface OHLCCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type TimeRange = '1' | '7' | '14' | '30' | '90' | '180' | '365' | 'max'

export interface TimeRangeOption {
  label: string
  days: TimeRange
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '1D', days: '1' },
  { label: '1W', days: '7' },
  { label: '2W', days: '14' },
  { label: '1M', days: '30' },
  { label: '3M', days: '90' },
  { label: '6M', days: '180' },
  { label: '1Y', days: '365' },
  { label: 'ALL', days: 'max' },
]
```

- [ ] **Step 2: Create chain config**

Create `src/lib/chains.ts`:

```ts
import type { ChainKey } from '../types'

export interface ChainConfig {
  key: ChainKey
  name: string
  moralisChain: string
  coingeckoPlatform: string
  wagmiChainId: number
}

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    moralisChain: 'eth',
    coingeckoPlatform: 'ethereum',
    wagmiChainId: 1,
  },
  arbitrum: {
    key: 'arbitrum',
    name: 'Arbitrum',
    moralisChain: 'arbitrum',
    coingeckoPlatform: 'arbitrum-one',
    wagmiChainId: 42161,
  },
  polygon: {
    key: 'polygon',
    name: 'Polygon',
    moralisChain: 'polygon',
    coingeckoPlatform: 'polygon-pos',
    wagmiChainId: 137,
  },
  bsc: {
    key: 'bsc',
    name: 'BSC',
    moralisChain: 'bsc',
    coingeckoPlatform: 'binance-smart-chain',
    wagmiChainId: 56,
  },
}

export const ALL_CHAINS = Object.values(CHAINS)
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/lib/chains.ts
git commit -m "feat: add shared types and chain config constants"
```

---

### Task 3: API Clients

**Files:**
- Create: `src/lib/moralis.ts`, `src/lib/moralis.test.ts`, `src/lib/coingecko.ts`, `src/lib/coingecko.test.ts`, `src/lib/fx.ts`, `src/lib/fx.test.ts`

- [ ] **Step 1: Write Moralis client tests**

Create `src/lib/moralis.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTokenBalances, fetchTokenTransfers } from './moralis'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchTokenBalances', () => {
  it('fetches ERC20 balances for an address on a chain', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          token_address: '0xabc',
          symbol: 'WBTC',
          name: 'Wrapped Bitcoin',
          decimals: 8,
          balance: '100000000',
          balance_formatted: '1.0',
          usd_price: 67000,
          usd_price_24hr_percent_change: 2.5,
          usd_value: 67000,
          logo: null,
          possible_spam: false,
        },
      ],
    })

    const result = await fetchTokenBalances('0x1234', 'eth')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2.2/0x1234/erc20'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': expect.any(String) }),
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('WBTC')
    expect(result[0].balanceFormatted).toBe('1.0')
  })

  it('filters out spam tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { token_address: '0xabc', symbol: 'WBTC', possible_spam: false, balance_formatted: '1.0', decimals: 8, balance: '100000000', usd_price: 67000, usd_price_24hr_percent_change: 0, usd_value: 67000, name: 'Wrapped Bitcoin' },
        { token_address: '0xspam', symbol: 'SCAM', possible_spam: true, balance_formatted: '999', decimals: 18, balance: '999000000000000000000', usd_price: 0, usd_price_24hr_percent_change: 0, usd_value: 0, name: 'Scam Token' },
      ],
    })

    const result = await fetchTokenBalances('0x1234', 'eth')
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('WBTC')
  })
})

describe('fetchTokenTransfers', () => {
  it('fetches token transfers and paginates', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cursor: 'page2cursor',
          result: [
            {
              transaction_hash: '0xtx1',
              block_timestamp: '2024-03-15T10:30:00.000Z',
              from_address: '0xother',
              to_address: '0x1234',
              value: '50000000',
              token_symbol: 'WBTC',
              token_decimals: '8',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cursor: null,
          result: [
            {
              transaction_hash: '0xtx2',
              block_timestamp: '2024-01-02T17:44:00.000Z',
              from_address: '0x1234',
              to_address: '0xother',
              value: '20000000',
              token_symbol: 'WBTC',
              token_decimals: '8',
            },
          ],
        }),
      })

    const result = await fetchTokenTransfers('0x1234', 'eth', '0xabc')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0].transaction_hash).toBe('0xtx1')
    expect(result[1].transaction_hash).toBe('0xtx2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/moralis.test.ts`
Expected: FAIL — module `./moralis` not found

- [ ] **Step 3: Implement Moralis client**

Create `src/lib/moralis.ts`:

```ts
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2'

function headers(): HeadersInit {
  return { 'X-API-Key': import.meta.env.VITE_MORALIS_API_KEY }
}

interface MoralisTokenBalance {
  token_address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balance_formatted: string
  usd_price: number
  usd_price_24hr_percent_change: number
  usd_value: number
  logo: string | null
  possible_spam: boolean
}

export async function fetchTokenBalances(
  address: string,
  chain: string,
): Promise<MoralisTokenBalance[]> {
  const url = `${MORALIS_BASE}/${address}/erc20?chain=${chain}&exclude_spam=true`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(`Moralis balances error: ${res.status}`)
  const data: MoralisTokenBalance[] = await res.json()
  return data.filter((t) => !t.possible_spam)
}

interface MoralisTransferResponse {
  cursor: string | null
  result: MoralisTransfer[]
}

export interface MoralisTransfer {
  transaction_hash: string
  block_timestamp: string
  from_address: string
  to_address: string
  value: string
  token_symbol: string
  token_decimals: string
}

export async function fetchTokenTransfers(
  address: string,
  chain: string,
  contractAddress: string,
): Promise<MoralisTransfer[]> {
  const allTransfers: MoralisTransfer[] = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams({
      chain,
      'contract_addresses[]': contractAddress,
      order: 'ASC',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    const url = `${MORALIS_BASE}/${address}/erc20/transfers?${params}`
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) throw new Error(`Moralis transfers error: ${res.status}`)

    const data: MoralisTransferResponse = await res.json()
    allTransfers.push(...data.result)
    cursor = data.cursor
  } while (cursor)

  return allTransfers
}
```

- [ ] **Step 4: Run Moralis tests**

Run: `npx vitest run src/lib/moralis.test.ts`
Expected: PASS

- [ ] **Step 5: Write CoinGecko client tests**

Create `src/lib/coingecko.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOHLC, fetchHistoricalPrice, resolveCoingeckoId } from './coingecko'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchOHLC', () => {
  it('fetches OHLC data and transforms to candle format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        [1710460800000, 71234.56, 71500.0, 71100.0, 71345.12],
        [1710462600000, 71345.12, 71600.0, 71200.0, 71420.0],
      ],
    })

    const result = await fetchOHLC('bitcoin', '7')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/coins/bitcoin/ohlc?vs_currency=usd&days=7'),
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      time: 1710460800,
      open: 71234.56,
      high: 71500.0,
      low: 71100.0,
      close: 71345.12,
    })
  })
})

describe('fetchHistoricalPrice', () => {
  it('fetches USD price at a specific date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        market_data: {
          current_price: { usd: 67234.5 },
        },
      }),
    })

    const price = await fetchHistoricalPrice('bitcoin', '2024-03-15')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/coins/bitcoin/history?date=15-03-2024'),
    )
    expect(price).toBe(67234.5)
  })
})

describe('resolveCoingeckoId', () => {
  it('maps a contract address to a CoinGecko ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'wrapped-bitcoin' }),
    })

    const id = await resolveCoingeckoId('ethereum', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')
    expect(id).toBe('wrapped-bitcoin')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/coingecko.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement CoinGecko client**

Create `src/lib/coingecko.ts`:

```ts
import type { OHLCCandle } from '../types'

const BASE = 'https://api.coingecko.com/api/v3'

export async function fetchOHLC(
  coinId: string,
  days: string,
): Promise<OHLCCandle[]> {
  const url = `${BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko OHLC error: ${res.status}`)

  const data: number[][] = await res.json()
  return data.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000),
    open,
    high,
    low,
    close,
  }))
}

export async function fetchHistoricalPrice(
  coinId: string,
  isoDate: string,
): Promise<number> {
  const [year, month, day] = isoDate.split('-')
  const cgDate = `${day}-${month}-${year}`
  const url = `${BASE}/coins/${coinId}/history?date=${cgDate}&localization=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko history error: ${res.status}`)

  const data = await res.json()
  return data.market_data.current_price.usd
}

export async function resolveCoingeckoId(
  platform: string,
  contractAddress: string,
): Promise<string> {
  const url = `${BASE}/coins/${platform}/contract/${contractAddress.toLowerCase()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko contract lookup error: ${res.status}`)

  const data = await res.json()
  return data.id
}
```

- [ ] **Step 8: Run CoinGecko tests**

Run: `npx vitest run src/lib/coingecko.test.ts`
Expected: PASS

- [ ] **Step 9: Write FX client tests**

Create `src/lib/fx.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFXRate, fetchCurrentFXRate } from './fx'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchFXRate', () => {
  it('fetches historical USD/SGD rate for a date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { SGD: 1.3425 } }),
    })

    const rate = await fetchFXRate('2024-03-15')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/2024-03-15?base=USD&symbols=SGD',
    )
    expect(rate).toBe(1.3425)
  })
})

describe('fetchCurrentFXRate', () => {
  it('fetches today USD/SGD rate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { SGD: 1.3401 } }),
    })

    const rate = await fetchCurrentFXRate()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD',
    )
    expect(rate).toBe(1.3401)
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run src/lib/fx.test.ts`
Expected: FAIL

- [ ] **Step 11: Implement FX client**

Create `src/lib/fx.ts`:

```ts
const BASE = 'https://api.frankfurter.dev/v1'

export async function fetchFXRate(isoDate: string): Promise<number> {
  const res = await fetch(`${BASE}/${isoDate}?base=USD&symbols=SGD`)
  if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`)
  const data = await res.json()
  return data.rates.SGD
}

export async function fetchCurrentFXRate(): Promise<number> {
  const res = await fetch(`${BASE}/latest?base=USD&symbols=SGD`)
  if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`)
  const data = await res.json()
  return data.rates.SGD
}
```

- [ ] **Step 12: Run FX tests**

Run: `npx vitest run src/lib/fx.test.ts`
Expected: PASS

- [ ] **Step 13: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 14: Commit**

```bash
git add src/lib/moralis.ts src/lib/moralis.test.ts src/lib/coingecko.ts src/lib/coingecko.test.ts src/lib/fx.ts src/lib/fx.test.ts
git commit -m "feat: add Moralis, CoinGecko, and Frankfurter API clients with tests"
```

---

### Task 4: wagmi Config and TanStack Query Persistence

**Files:**
- Create: `src/wagmiConfig.ts`, `src/queryClient.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create wagmi config**

Create `src/wagmiConfig.ts`:

```ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, arbitrum, polygon, bsc } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'CryptoFolio',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, arbitrum, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
})
```

- [ ] **Step 2: Create query client with IndexedDB persistence**

Create `src/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
    },
  },
})

queryClient.setQueryDefaults(['tokenBalances'], {
  staleTime: 1000 * 60,
})

queryClient.setQueryDefaults(['ohlc'], {
  staleTime: 1000 * 60 * 5,
})

queryClient.setQueryDefaults(['tradeHistory'], {
  staleTime: 1000 * 60 * 30,
})

queryClient.setQueryDefaults(['fxRate', 'historical'], {
  staleTime: Infinity,
})

queryClient.setQueryDefaults(['fxRate', 'current'], {
  staleTime: 1000 * 60 * 60,
})

queryClient.setQueryDefaults(['coingeckoId'], {
  staleTime: Infinity,
})

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const value = await get(key)
      return value ?? null
    },
    setItem: async (key, value) => {
      await set(key, value)
    },
    removeItem: async (key) => {
      await del(key)
    },
  },
  throttleTime: 1000,
  key: 'cryptofolio-cache',
})
```

- [ ] **Step 3: Wire up providers in main.tsx**

Replace `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './wagmiConfig'
import { queryClient, persister } from './queryClient'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </PersistQueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 4: Verify app still starts**

Run: `npm run dev`
Expected: App starts without errors. RainbowKit styles are loaded.

- [ ] **Step 5: Commit**

```bash
git add src/wagmiConfig.ts src/queryClient.ts src/main.tsx
git commit -m "feat: configure wagmi, RainbowKit, and TanStack Query with IndexedDB persistence"
```

---

### Task 5: Data Hooks

**Files:**
- Create: `src/hooks/useTokenBalances.ts`, `src/hooks/useTokenBalances.test.ts`, `src/hooks/useOHLC.ts`, `src/hooks/useOHLC.test.ts`, `src/hooks/useTradeHistory.ts`, `src/hooks/useTradeHistory.test.ts`, `src/hooks/useFXRate.ts`, `src/hooks/useFXRate.test.ts`

- [ ] **Step 1: Write useTokenBalances test**

Create `src/hooks/useTokenBalances.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTokenBalances } from './useTokenBalances'
import * as moralis from '../lib/moralis'

vi.mock('../lib/moralis')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTokenBalances', () => {
  it('fetches balances across all chains and returns unified list', async () => {
    vi.mocked(moralis.fetchTokenBalances).mockResolvedValue([
      {
        token_address: '0xabc',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        balance: '100000000',
        balance_formatted: '1.0',
        usd_price: 67000,
        usd_price_24hr_percent_change: 2.5,
        usd_value: 67000,
        logo: null,
        possible_spam: false,
      },
    ])

    const { result } = renderHook(() => useTokenBalances('0x1234'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(moralis.fetchTokenBalances).toHaveBeenCalledTimes(4)
    expect(result.current.data!.length).toBeGreaterThanOrEqual(1)
    expect(result.current.data![0].symbol).toBe('WBTC')
    expect(result.current.data![0].chain).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useTokenBalances.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement useTokenBalances**

Create `src/hooks/useTokenBalances.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchTokenBalances } from '../lib/moralis'
import { ALL_CHAINS } from '../lib/chains'
import type { TokenBalance, ChainKey } from '../types'

export function useTokenBalances(address: string | undefined) {
  return useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address) return []

      const results = await Promise.all(
        ALL_CHAINS.map(async (chain) => {
          const balances = await fetchTokenBalances(address, chain.moralisChain)
          return balances.map((b) => ({
            tokenAddress: b.token_address,
            symbol: b.symbol,
            name: b.name,
            decimals: b.decimals,
            balance: b.balance,
            balanceFormatted: b.balance_formatted,
            usdPrice: b.usd_price,
            usdValue: b.usd_value,
            usdPrice24hrPercentChange: b.usd_price_24hr_percent_change,
            chain: chain.key as ChainKey,
            logo: b.logo ?? undefined,
          }))
        }),
      )

      return results.flat().sort((a, b) => b.usdValue - a.usdValue)
    },
    enabled: !!address,
  })
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/hooks/useTokenBalances.test.ts`
Expected: PASS

- [ ] **Step 5: Write useOHLC test**

Create `src/hooks/useOHLC.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useOHLC } from './useOHLC'
import * as coingecko from '../lib/coingecko'

vi.mock('../lib/coingecko')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOHLC', () => {
  it('resolves coingecko ID then fetches OHLC data', async () => {
    vi.mocked(coingecko.resolveCoingeckoId).mockResolvedValue('wrapped-bitcoin')
    vi.mocked(coingecko.fetchOHLC).mockResolvedValue([
      { time: 1710460800, open: 71234, high: 71500, low: 71100, close: 71345 },
    ])

    const { result } = renderHook(
      () => useOHLC('0xabc', 'ethereum', '30'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].close).toBe(71345)
  })
})
```

- [ ] **Step 6: Implement useOHLC**

Create `src/hooks/useOHLC.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { resolveCoingeckoId, fetchOHLC } from '../lib/coingecko'
import { CHAINS } from '../lib/chains'
import type { ChainKey, OHLCCandle } from '../types'

export function useCoingeckoId(tokenAddress: string | undefined, chain: ChainKey | undefined) {
  return useQuery({
    queryKey: ['coingeckoId', chain, tokenAddress],
    queryFn: () => resolveCoingeckoId(CHAINS[chain!].coingeckoPlatform, tokenAddress!),
    enabled: !!tokenAddress && !!chain,
  })
}

export function useOHLC(
  tokenAddress: string | undefined,
  chain: ChainKey | undefined,
  days: string,
) {
  const { data: coinId } = useCoingeckoId(tokenAddress, chain)

  return useQuery<OHLCCandle[]>({
    queryKey: ['ohlc', coinId, days],
    queryFn: () => fetchOHLC(coinId!, days),
    enabled: !!coinId,
  })
}
```

- [ ] **Step 7: Run test**

Run: `npx vitest run src/hooks/useOHLC.test.ts`
Expected: PASS

- [ ] **Step 8: Write useTradeHistory test**

Create `src/hooks/useTradeHistory.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTradeHistory } from './useTradeHistory'
import * as moralis from '../lib/moralis'
import * as coingecko from '../lib/coingecko'
import * as fx from '../lib/fx'

vi.mock('../lib/moralis')
vi.mock('../lib/coingecko')
vi.mock('../lib/fx')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTradeHistory', () => {
  it('fetches transfers and enriches with USD and FX data', async () => {
    vi.mocked(moralis.fetchTokenTransfers).mockResolvedValue([
      {
        transaction_hash: '0xtx1',
        block_timestamp: '2024-03-15T10:30:00.000Z',
        from_address: '0xother',
        to_address: '0x1234',
        value: '50000000',
        token_symbol: 'WBTC',
        token_decimals: '8',
      },
    ])
    vi.mocked(coingecko.resolveCoingeckoId).mockResolvedValue('wrapped-bitcoin')
    vi.mocked(coingecko.fetchHistoricalPrice).mockResolvedValue(67000)
    vi.mocked(fx.fetchFXRate).mockResolvedValue(1.34)
    vi.mocked(fx.fetchCurrentFXRate).mockResolvedValue(1.32)

    const { result } = renderHook(
      () => useTradeHistory('0x1234', 'ethereum', '0xabc'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const trade = result.current.data![0]
    expect(trade.type).toBe('buy')
    expect(trade.valueFormatted).toBe(0.5)
    expect(trade.usdValue).toBeCloseTo(33500)
    expect(trade.sgdThen).toBeCloseTo(33500 * 1.34)
    expect(trade.sgdNow).toBeCloseTo(33500 * 1.32)
    expect(trade.fxImpact).toBeCloseTo(33500 * 1.32 - 33500 * 1.34)
  })
})
```

- [ ] **Step 9: Implement useTradeHistory**

Create `src/hooks/useTradeHistory.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchTokenTransfers } from '../lib/moralis'
import { resolveCoingeckoId, fetchHistoricalPrice } from '../lib/coingecko'
import { fetchFXRate, fetchCurrentFXRate } from '../lib/fx'
import { CHAINS } from '../lib/chains'
import type { ChainKey, Trade } from '../types'

export function useTradeHistory(
  address: string | undefined,
  chain: ChainKey | undefined,
  tokenAddress: string | undefined,
) {
  return useQuery({
    queryKey: ['tradeHistory', address, chain, tokenAddress],
    queryFn: async (): Promise<Trade[]> => {
      const transfers = await fetchTokenTransfers(
        address!,
        CHAINS[chain!].moralisChain,
        tokenAddress!,
      )

      const coinId = await resolveCoingeckoId(
        CHAINS[chain!].coingeckoPlatform,
        tokenAddress!,
      )

      const currentFXRate = await fetchCurrentFXRate()

      const trades = await Promise.all(
        transfers.map(async (t) => {
          const decimals = parseInt(t.token_decimals, 10)
          const valueFormatted = parseInt(t.value, 10) / 10 ** decimals
          const type: 'buy' | 'sell' =
            t.to_address.toLowerCase() === address!.toLowerCase() ? 'buy' : 'sell'

          const date = t.block_timestamp.split('T')[0]
          const [usdPrice, fxRate] = await Promise.all([
            fetchHistoricalPrice(coinId, date),
            fetchFXRate(date),
          ])

          const usdValue = valueFormatted * usdPrice
          const sgdThen = usdValue * fxRate
          const sgdNow = usdValue * currentFXRate
          const fxImpact = sgdNow - sgdThen

          return {
            transactionHash: t.transaction_hash,
            blockTimestamp: t.block_timestamp,
            fromAddress: t.from_address,
            toAddress: t.to_address,
            value: t.value,
            valueFormatted,
            tokenSymbol: t.token_symbol,
            tokenDecimals: decimals,
            type,
            usdValue,
            sgdThen,
            sgdNow,
            fxImpact,
          }
        }),
      )

      return trades
    },
    enabled: !!address && !!chain && !!tokenAddress,
  })
}
```

- [ ] **Step 10: Run test**

Run: `npx vitest run src/hooks/useTradeHistory.test.ts`
Expected: PASS

- [ ] **Step 11: Write useFXRate test**

Create `src/hooks/useFXRate.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCurrentFXRate } from './useFXRate'
import * as fx from '../lib/fx'

vi.mock('../lib/fx')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useCurrentFXRate', () => {
  it('fetches current USD/SGD rate', async () => {
    vi.mocked(fx.fetchCurrentFXRate).mockResolvedValue(1.34)

    const { result } = renderHook(() => useCurrentFXRate(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(1.34)
  })
})
```

- [ ] **Step 12: Implement useFXRate**

Create `src/hooks/useFXRate.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentFXRate } from '../lib/fx'

export function useCurrentFXRate() {
  return useQuery({
    queryKey: ['fxRate', 'current'],
    queryFn: fetchCurrentFXRate,
  })
}
```

- [ ] **Step 13: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 14: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data hooks for token balances, OHLC, trade history, and FX rates"
```

---

### Task 6: ConnectButton and PortfolioHeader Components

**Files:**
- Create: `src/components/ConnectButton.tsx`, `src/components/ConnectButton.test.tsx`, `src/components/PortfolioHeader.tsx`, `src/components/PortfolioHeader.test.tsx`

- [ ] **Step 1: Write ConnectButton test**

Create `src/components/ConnectButton.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectButton } from './ConnectButton'

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: any) => React.ReactNode }) =>
      children({
        account: undefined,
        chain: undefined,
        openConnectModal: vi.fn(),
        mounted: true,
      }),
  },
}))

describe('ConnectButton', () => {
  it('renders connect button when not connected', () => {
    render(<ConnectButton />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement ConnectButton**

Create `src/components/ConnectButton.tsx`:

```tsx
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        const connected = mounted && account && chain

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                className="bg-slate-800 hover:bg-slate-700 text-green-400 px-4 py-2 rounded-lg font-mono text-sm transition-colors"
              >
                {account.displayName}
              </button>
            )}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
```

- [ ] **Step 3: Run test**

Run: `npx vitest run src/components/ConnectButton.test.tsx`
Expected: PASS

- [ ] **Step 4: Write PortfolioHeader test**

Create `src/components/PortfolioHeader.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioHeader } from './PortfolioHeader'

describe('PortfolioHeader', () => {
  it('renders total value and 24h change', () => {
    render(<PortfolioHeader totalValue={24532.5} change24h={2.4} />)
    expect(screen.getByText('$24,532.50')).toBeInTheDocument()
    expect(screen.getByText('+2.40%')).toBeInTheDocument()
  })

  it('shows negative change in red', () => {
    render(<PortfolioHeader totalValue={10000} change24h={-1.5} />)
    const change = screen.getByText('-1.50%')
    expect(change.className).toContain('text-red')
  })

  it('renders zero state', () => {
    render(<PortfolioHeader totalValue={0} change24h={0} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Implement PortfolioHeader**

Create `src/components/PortfolioHeader.tsx`:

```tsx
interface PortfolioHeaderProps {
  totalValue: number
  change24h: number
}

export function PortfolioHeader({ totalValue, change24h }: PortfolioHeaderProps) {
  const changeColor = change24h >= 0 ? 'text-green-400' : 'text-red-400'
  const changePrefix = change24h >= 0 ? '+' : ''

  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-sm text-slate-400">Total Portfolio</div>
        <div className="text-2xl font-bold text-white">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div>
        <div className="text-sm text-slate-400">24h Change</div>
        <div className={`text-lg font-semibold ${changeColor}`}>
          {changePrefix}{change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/components/PortfolioHeader.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ConnectButton.tsx src/components/ConnectButton.test.tsx src/components/PortfolioHeader.tsx src/components/PortfolioHeader.test.tsx
git commit -m "feat: add ConnectButton and PortfolioHeader components"
```

---

### Task 7: TokenDropdown Component

**Files:**
- Create: `src/components/TokenDropdown.tsx`, `src/components/TokenDropdown.test.tsx`

- [ ] **Step 1: Write TokenDropdown test**

Create `src/components/TokenDropdown.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TokenDropdown } from './TokenDropdown'
import type { TokenBalance } from '../types'

const tokens: TokenBalance[] = [
  {
    tokenAddress: '0xabc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    balance: '160000000',
    balanceFormatted: '1.6',
    usdPrice: 67000,
    usdValue: 107200,
    usdPrice24hrPercentChange: 3.2,
    chain: 'ethereum',
  },
  {
    tokenAddress: '0xdef',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '4200000000000000000',
    balanceFormatted: '4.2',
    usdPrice: 1952,
    usdValue: 8198,
    usdPrice24hrPercentChange: -1.1,
    chain: 'arbitrum',
  },
]

describe('TokenDropdown', () => {
  it('shows selected token info when closed', () => {
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByText('WBTC')).toBeInTheDocument()
    expect(screen.getByText('(Ethereum)')).toBeInTheDocument()
    expect(screen.getByText('1.6')).toBeInTheDocument()
  })

  it('opens dropdown and shows all tokens on click', async () => {
    const user = userEvent.setup()
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={vi.fn()} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('(Arbitrum)')).toBeInTheDocument()
  })

  it('calls onSelect when a token is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('ETH'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TokenDropdown.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement TokenDropdown**

Create `src/components/TokenDropdown.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import type { TokenBalance } from '../types'
import { CHAINS } from '../lib/chains'

interface TokenDropdownProps {
  tokens: TokenBalance[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function TokenDropdown({ tokens, selectedIndex, onSelect }: TokenDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = tokens[selectedIndex]
  if (!selected) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">{selected.symbol}</span>
          <span className="text-slate-400 text-sm">({CHAINS[selected.chain].name})</span>
          <span className="text-slate-300 text-sm">{selected.balanceFormatted}</span>
          <span className="text-slate-400 text-sm">
            ${selected.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
          {tokens.map((token, index) => (
            <button
              key={`${token.tokenAddress}-${token.chain}`}
              onClick={() => {
                onSelect(index)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                index === selectedIndex ? 'bg-slate-700/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold ${index === selectedIndex ? 'text-rose-500' : 'text-white'}`}>
                  {token.symbol}
                </span>
                <span className="text-slate-400 text-sm">({CHAINS[token.chain].name})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm">{token.balanceFormatted}</span>
                <span className="text-slate-400 text-sm">
                  ${token.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/components/TokenDropdown.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TokenDropdown.tsx src/components/TokenDropdown.test.tsx
git commit -m "feat: add TokenDropdown component with chain-specific token selection"
```

---

### Task 8: TimeRangeBar Component

**Files:**
- Create: `src/components/TimeRangeBar.tsx`, `src/components/TimeRangeBar.test.tsx`

- [ ] **Step 1: Write TimeRangeBar test**

Create `src/components/TimeRangeBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeRangeBar } from './TimeRangeBar'

describe('TimeRangeBar', () => {
  it('renders all time range options', () => {
    render(<TimeRangeBar selected="30" onSelect={vi.fn()} />)
    expect(screen.getByText('1D')).toBeInTheDocument()
    expect(screen.getByText('1W')).toBeInTheDocument()
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('ALL')).toBeInTheDocument()
  })

  it('highlights the selected range', () => {
    render(<TimeRangeBar selected="30" onSelect={vi.fn()} />)
    const button = screen.getByText('1M')
    expect(button.className).toContain('bg-rose-600')
  })

  it('calls onSelect with the days value', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TimeRangeBar selected="30" onSelect={onSelect} />)

    await user.click(screen.getByText('1W'))
    expect(onSelect).toHaveBeenCalledWith('7')
  })
})
```

- [ ] **Step 2: Implement TimeRangeBar**

Create `src/components/TimeRangeBar.tsx`:

```tsx
import { TIME_RANGE_OPTIONS, type TimeRange } from '../types'

interface TimeRangeBarProps {
  selected: TimeRange
  onSelect: (range: TimeRange) => void
}

export function TimeRangeBar({ selected, onSelect }: TimeRangeBarProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_RANGE_OPTIONS.map((option) => (
        <button
          key={option.days}
          onClick={() => onSelect(option.days)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            selected === option.days
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Run test**

Run: `npx vitest run src/components/TimeRangeBar.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/TimeRangeBar.tsx src/components/TimeRangeBar.test.tsx
git commit -m "feat: add TimeRangeBar component"
```

---

### Task 9: PriceChart Component

**Files:**
- Create: `src/components/PriceChart.tsx`, `src/components/PriceChart.test.tsx`

- [ ] **Step 1: Write PriceChart test**

Create `src/components/PriceChart.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PriceChart } from './PriceChart'
import type { OHLCCandle, Trade } from '../types'

vi.mock('lightweight-charts', () => {
  const mockSeries = {
    setData: vi.fn(),
    setMarkers: vi.fn(),
  }
  const mockTimeScale = {
    fitContent: vi.fn(),
    setVisibleRange: vi.fn(),
  }
  const mockChart = {
    addCandlestickSeries: vi.fn(() => mockSeries),
    timeScale: vi.fn(() => mockTimeScale),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    subscribeClick: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
  }
  return {
    createChart: vi.fn(() => mockChart),
    ColorType: { Solid: 'Solid' },
  }
})

const candles: OHLCCandle[] = [
  { time: 1710460800, open: 71234, high: 71500, low: 71100, close: 71345 },
  { time: 1710547200, open: 71345, high: 71600, low: 71200, close: 71420 },
]

const trades: Trade[] = [
  {
    transactionHash: '0xtx1',
    blockTimestamp: '2024-03-15T10:30:00.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '50000000',
    valueFormatted: 0.5,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 35617,
  },
]

describe('PriceChart', () => {
  it('renders a chart container', () => {
    const { container } = render(
      <PriceChart
        candles={candles}
        trades={trades}
        selectedTradeIndex={null}
        onTradeClick={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('calls createChart on mount', async () => {
    const { createChart } = await import('lightweight-charts')
    render(
      <PriceChart
        candles={candles}
        trades={trades}
        selectedTradeIndex={null}
        onTradeClick={vi.fn()}
      />,
    )
    expect(createChart).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PriceChart.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement PriceChart**

Create `src/components/PriceChart.tsx`:

```tsx
import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'
import type { OHLCCandle, Trade } from '../types'

interface PriceChartProps {
  candles: OHLCCandle[]
  trades: Trade[]
  selectedTradeIndex: number | null
  onTradeClick: (index: number) => void
}

function tradesToMarkers(trades: Trade[]): SeriesMarker<Time>[] {
  return trades.map((trade, index) => ({
    time: (Math.floor(new Date(trade.blockTimestamp).getTime() / 1000)) as Time,
    position: trade.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
    color: trade.type === 'buy' ? '#4ade80' : '#ef4444',
    shape: trade.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
    text: `${trade.type === 'buy' ? 'BUY' : 'SELL'} ${trade.valueFormatted}`,
    id: String(index),
  }))
}

export function PriceChart({ candles, trades, selectedTradeIndex, onTradeClick }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const handleClick = useCallback(
    (param: any) => {
      if (param.hoveredObjectId != null) {
        const index = parseInt(param.hoveredObjectId, 10)
        if (!isNaN(index)) {
          onTradeClick(index)
        }
      }
    },
    [onTradeClick],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a1a' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: '#1e1e3a' },
        horzLines: { color: '#1e1e3a' },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: {
        vertLine: { color: '#ffffff33', style: 3 },
        horzLine: { color: '#ffffff33', style: 3 },
      },
    })

    const series = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series

    chart.subscribeClick(handleClick)

    chart.subscribeCrosshairMove((param: any) => {
      if (containerRef.current) {
        containerRef.current.style.cursor = param.hoveredObjectId != null ? 'pointer' : 'default'
      }
    })

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [handleClick])

  useEffect(() => {
    if (!seriesRef.current) return
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    seriesRef.current.setData(data)
    seriesRef.current.setMarkers(tradesToMarkers(trades))
    chartRef.current?.timeScale().fitContent()
  }, [candles, trades])

  useEffect(() => {
    if (selectedTradeIndex === null || !chartRef.current || !trades[selectedTradeIndex]) return

    const trade = trades[selectedTradeIndex]
    const targetTime = Math.floor(new Date(trade.blockTimestamp).getTime() / 1000)
    const dayInSeconds = 86400
    const offset = 15 * dayInSeconds

    chartRef.current.timeScale().setVisibleRange({
      from: (targetTime - offset) as Time,
      to: (targetTime + offset) as Time,
    })
  }, [selectedTradeIndex, trades])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
    />
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/components/PriceChart.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PriceChart.tsx src/components/PriceChart.test.tsx
git commit -m "feat: add PriceChart component with candlesticks, markers, and click handling"
```

---

### Task 10: TradeTable Component

**Files:**
- Create: `src/components/TradeTable.tsx`, `src/components/TradeTable.test.tsx`

- [ ] **Step 1: Write TradeTable test**

Create `src/components/TradeTable.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TradeTable } from './TradeTable'
import type { Trade } from '../types'

const trades: Trade[] = [
  {
    transactionHash: '0xtx1',
    blockTimestamp: '2025-06-03T14:32:18.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '30000000',
    valueFormatted: 0.3,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 19740,
    sgdThen: 26449,
    sgdNow: 26076,
    fxImpact: -373,
  },
  {
    transactionHash: '0xtx2',
    blockTimestamp: '2025-09-18T09:15:42.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '100000000',
    valueFormatted: 1.0,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 58200,
    sgdThen: 76824,
    sgdNow: 76914,
    fxImpact: 90,
  },
]

describe('TradeTable', () => {
  it('renders trade rows with correct data', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('0.3 WBTC')).toBeInTheDocument()
  })

  it('shows running totals in dimmed text', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Total: 0.3')).toBeInTheDocument()
    expect(screen.getByText('Total: 1.3')).toBeInTheDocument()
  })

  it('calls onRowClick when a row is clicked', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        selectedIndex={null}
        onRowClick={onRowClick}
      />,
    )

    const rows = screen.getAllByRole('row')
    await user.click(rows[1])
    expect(onRowClick).toHaveBeenCalledWith(0)
  })

  it('renders footer with totals', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('1.3 WBTC')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TradeTable.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement TradeTable**

Create `src/components/TradeTable.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import type { Trade } from '../types'

interface TradeTableProps {
  trades: Trade[]
  tokenSymbol: string
  currentValue: number
  selectedIndex: number | null
  onRowClick: (index: number) => void
}

function formatCurrency(value: number, prefix: string = '$'): string {
  return `${prefix}${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toISOString().split('T')[0]
  const time = d.toISOString().split('T')[1].slice(0, 5)
  return `${date} ${time}`
}

export function TradeTable({ trades, tokenSymbol, currentValue, selectedIndex, onRowClick }: TradeTableProps) {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  useEffect(() => {
    if (selectedIndex !== null && rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]!.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedIndex])

  let runningAmount = 0
  let runningUsd = 0
  let runningSgdThen = 0
  let runningSgdNow = 0
  let runningFxImpact = 0

  const rows = trades.map((trade, index) => {
    const sign = trade.type === 'buy' ? 1 : -1
    runningAmount += trade.valueFormatted * sign
    runningUsd += (trade.usdValue ?? 0) * sign
    runningSgdThen += (trade.sgdThen ?? 0) * sign
    runningSgdNow += (trade.sgdNow ?? 0) * sign
    runningFxImpact += trade.fxImpact ?? 0

    const isSelected = selectedIndex === index
    const highlight = isSelected ? 'bg-slate-700/60 ring-1 ring-rose-500/50' : ''

    return (
      <tr
        key={trade.transactionHash}
        ref={(el) => { rowRefs.current[index] = el }}
        onClick={() => onRowClick(index)}
        role="row"
        className={`cursor-pointer hover:bg-slate-800/50 transition-colors ${highlight}`}
      >
        <td className="px-3 py-2 text-slate-300 text-sm">
          {formatTimestamp(trade.blockTimestamp)}
        </td>
        <td className={`px-3 py-2 font-bold text-sm ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
          {trade.type === 'buy' ? 'Buy' : 'Sell'}
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{trade.valueFormatted} {tokenSymbol}</div>
          <div className="text-slate-500 text-xs">Total: {runningAmount.toFixed(4)}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.usdValue ?? 0)}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningUsd)}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.sgdThen ?? 0, 'S$')}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningSgdThen, 'S$')}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.sgdNow ?? 0, 'S$')}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningSgdNow, 'S$')}</div>
        </td>
        <td className="px-3 py-2">
          <div className={`text-sm ${(trade.fxImpact ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(trade.fxImpact ?? 0) >= 0 ? '+' : '-'}{formatCurrency(trade.fxImpact ?? 0, 'S$')}
          </div>
          <div className="text-slate-500 text-xs">
            Total: {runningFxImpact >= 0 ? '+' : '-'}{formatCurrency(runningFxImpact, 'S$')}
          </div>
        </td>
      </tr>
    )
  })

  const totalAmount = trades.reduce((acc, t) => acc + t.valueFormatted * (t.type === 'buy' ? 1 : -1), 0)
  const totalFxImpact = trades.reduce((acc, t) => acc + (t.fxImpact ?? 0), 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-900/80 text-slate-400 text-xs">
            <th className="px-3 py-2 text-left font-medium">Date & Time</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Amount</th>
            <th className="px-3 py-2 text-left font-medium">USD Value</th>
            <th className="px-3 py-2 text-left font-medium">SGD (then)</th>
            <th className="px-3 py-2 text-left font-medium">SGD (now)</th>
            <th className="px-3 py-2 text-left font-medium">FX Impact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-3 px-3 py-2 bg-slate-900/50 rounded-lg text-sm">
        <div>
          <span className="text-slate-400">Holdings: </span>
          <span className="text-white font-medium">{totalAmount.toFixed(4)} {tokenSymbol}</span>
        </div>
        <div>
          <span className="text-slate-400">Current value: </span>
          <span className="text-white font-medium">{formatCurrency(currentValue)}</span>
        </div>
        <div>
          <span className="text-slate-400">Total FX impact: </span>
          <span className={totalFxImpact >= 0 ? 'text-green-400' : 'text-red-400'}>
            {totalFxImpact >= 0 ? '+' : '-'}{formatCurrency(totalFxImpact, 'S$')}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/components/TradeTable.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TradeTable.tsx src/components/TradeTable.test.tsx
git commit -m "feat: add TradeTable with running totals, FX impact, and row selection"
```

---

### Task 11: Trade Selection Hook (Chart ↔ Table Linking)

**Files:**
- Create: `src/hooks/useTradeSelection.ts`, `src/hooks/useTradeSelection.test.ts`

- [ ] **Step 1: Write useTradeSelection test**

Create `src/hooks/useTradeSelection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTradeSelection } from './useTradeSelection'

describe('useTradeSelection', () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    expect(result.current.selectedIndex).toBeNull()
  })

  it('selects a trade by index', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(2))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('selectPrevious moves to previous trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(3))
    act(() => result.current.selectPrevious())
    expect(result.current.selectedIndex).toBe(2)
  })

  it('selectPrevious does not go below 0', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(0))
    act(() => result.current.selectPrevious())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('selectNext moves to next trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(2))
    act(() => result.current.selectNext())
    expect(result.current.selectedIndex).toBe(3)
  })

  it('selectNext does not exceed trade count', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(4))
    act(() => result.current.selectNext())
    expect(result.current.selectedIndex).toBe(4)
  })

  it('selectLast jumps to the last trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(0))
    act(() => result.current.selectLast())
    expect(result.current.selectedIndex).toBe(4)
  })

  it('resets selection when trade count changes', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useTradeSelection(count),
      { initialProps: { count: 5 } },
    )
    act(() => result.current.select(3))
    rerender({ count: 3 })
    expect(result.current.selectedIndex).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useTradeSelection.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement useTradeSelection**

Create `src/hooks/useTradeSelection.ts`:

```ts
import { useState, useCallback, useEffect } from 'react'

export function useTradeSelection(tradeCount: number) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    setSelectedIndex(null)
  }, [tradeCount])

  const select = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null || prev <= 0) return prev ?? 0
      return prev - 1
    })
  }, [])

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0
      if (prev >= tradeCount - 1) return prev
      return prev + 1
    })
  }, [tradeCount])

  const selectLast = useCallback(() => {
    if (tradeCount > 0) {
      setSelectedIndex(tradeCount - 1)
    }
  }, [tradeCount])

  return { selectedIndex, select, selectPrevious, selectNext, selectLast }
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/hooks/useTradeSelection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTradeSelection.ts src/hooks/useTradeSelection.test.ts
git commit -m "feat: add useTradeSelection hook for chart ↔ table linked navigation"
```

---

### Task 12: App Assembly — Wire Everything Together

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement App.tsx**

Replace `src/App.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from './components/ConnectButton'
import { PortfolioHeader } from './components/PortfolioHeader'
import { TokenDropdown } from './components/TokenDropdown'
import { TimeRangeBar } from './components/TimeRangeBar'
import { PriceChart } from './components/PriceChart'
import { TradeTable } from './components/TradeTable'
import { useTokenBalances } from './hooks/useTokenBalances'
import { useOHLC } from './hooks/useOHLC'
import { useTradeHistory } from './hooks/useTradeHistory'
import { useTradeSelection } from './hooks/useTradeSelection'
import type { TimeRange } from './types'

export default function App() {
  const { address, isConnected } = useAccount()
  const { data: tokens } = useTokenBalances(address)
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0)
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  const selectedToken = tokens?.[selectedTokenIndex]

  const { data: candles } = useOHLC(
    selectedToken?.tokenAddress,
    selectedToken?.chain,
    timeRange,
  )

  const { data: trades } = useTradeHistory(
    address,
    selectedToken?.chain,
    selectedToken?.tokenAddress,
  )

  const { selectedIndex, select, selectPrevious, selectNext, selectLast } =
    useTradeSelection(trades?.length ?? 0)

  useEffect(() => {
    setSelectedTokenIndex(0)
  }, [address])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!trades?.length) return
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          selectPrevious()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          selectNext()
          break
        case 'End':
          e.preventDefault()
          selectLast()
          break
      }
    },
    [trades, selectPrevious, selectNext, selectLast],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const totalValue = tokens?.reduce((sum, t) => sum + t.usdValue, 0) ?? 0
  const weightedChange = tokens?.length
    ? tokens.reduce((sum, t) => sum + t.usdPrice24hrPercentChange * (t.usdValue / totalValue), 0)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-rose-500">CryptoFolio</h1>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-slate-400 text-lg">Connect your wallet to get started</p>
          </div>
        ) : (
          <>
            {/* Portfolio summary */}
            <div className="mb-6">
              <PortfolioHeader totalValue={totalValue} change24h={weightedChange} />
            </div>

            {/* Token selector */}
            {tokens && tokens.length > 0 ? (
              <>
                <div className="mb-4">
                  <TokenDropdown
                    tokens={tokens}
                    selectedIndex={selectedTokenIndex}
                    onSelect={setSelectedTokenIndex}
                  />
                </div>

                {/* Time range */}
                <div className="mb-4">
                  <TimeRangeBar selected={timeRange} onSelect={setTimeRange} />
                </div>

                {/* Price chart */}
                {candles && (
                  <div className="mb-6">
                    <PriceChart
                      candles={candles}
                      trades={trades ?? []}
                      selectedTradeIndex={selectedIndex}
                      onTradeClick={select}
                    />
                  </div>
                )}

                {/* Trade table */}
                {trades && selectedToken && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-white mb-3">Trade History</h2>
                    <TradeTable
                      trades={trades}
                      tokenSymbol={selectedToken.symbol}
                      currentValue={selectedToken.usdValue}
                      selectedIndex={selectedIndex}
                      onRowClick={select}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">No tokens found for this wallet</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify app runs**

Run: `npm run dev`
Expected: App starts. Shows "CryptoFolio" header with Connect Wallet button. Connecting a wallet should trigger data fetching.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble App with all components, linked selection, and keyboard navigation"
```

---

### Task 13: Containerfile

**Files:**
- Create: `Containerfile`, `nginx.conf`

- [ ] **Step 1: Create nginx config**

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Create Containerfile**

Create `Containerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_MORALIS_API_KEY
ARG VITE_WALLETCONNECT_PROJECT_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Test the build**

Run:
```bash
podman build \
  --build-arg VITE_MORALIS_API_KEY=test \
  --build-arg VITE_WALLETCONNECT_PROJECT_ID=test \
  -t cryptofolio .
```

Expected: Build completes. Image is created.

Run: `podman run --rm -p 8080:80 cryptofolio`
Expected: App is served on http://localhost:8080.

- [ ] **Step 4: Commit**

```bash
git add Containerfile nginx.conf
git commit -m "feat: add Containerfile for Podman deployment with nginx"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Verify:
1. App loads with dark theme
2. "Connect Wallet" button is visible
3. Connecting via Rabby shows wallet address
4. Token dropdown populates with chain-specific tokens
5. Selecting a token shows candlestick chart
6. Time range pills change the chart data
7. Trade table shows below chart with running totals
8. Clicking a table row highlights it and pans chart
9. Clicking a chart marker highlights table row and scrolls
10. Arrow keys navigate between trades
11. End key jumps to most recent trade
12. Responsive layout works on narrow viewport

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
