import type { TokenBalance, Trade, OHLCCandle, TimeRange } from '../types'

export const MOCK_TOKENS: TokenBalance[] = [
  {
    tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    balance: '150000000',
    balanceFormatted: '1.5',
    usdPrice: 67842,
    usdValue: 101763,
    usdPrice24hrPercentChange: 2.34,
    chain: 'ethereum',
  },
  {
    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '4200000000000000000',
    balanceFormatted: '4.2',
    usdPrice: 3512,
    usdValue: 14754,
    usdPrice24hrPercentChange: -1.12,
    chain: 'ethereum',
  },
  {
    tokenAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '5200000000',
    balanceFormatted: '5200.00',
    usdPrice: 1.0,
    usdValue: 5200,
    usdPrice24hrPercentChange: 0.01,
    chain: 'arbitrum',
  },
  {
    tokenAddress: '0x0000000000000000000000000000000000001010',
    symbol: 'POL',
    name: 'Polygon',
    decimals: 18,
    balance: '3500000000000000000000',
    balanceFormatted: '3500.0',
    usdPrice: 0.874,
    usdValue: 3059,
    usdPrice24hrPercentChange: 3.76,
    chain: 'polygon',
  },
  {
    tokenAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    balance: '2800000000000000000',
    balanceFormatted: '2.8',
    usdPrice: 412,
    usdValue: 1155,
    usdPrice24hrPercentChange: 0.88,
    chain: 'bsc',
  },
]

// --- Candle generation ---

const END_TIME = 1774915200 // 2026-03-31 00:00:00 UTC

// Time range → candle interval (seconds) and duration (seconds)
interface RangeConfig {
  interval: number  // candle width in seconds
  duration: number  // total time window in seconds
}

const RANGE_CONFIGS: Record<string, RangeConfig> = {
  '1':   { interval: 300,    duration: 86400 },       // 1D: 5-min candles
  '7':   { interval: 1800,   duration: 7 * 86400 },   // 1W: 30-min candles
  '14':  { interval: 3600,   duration: 14 * 86400 },  // 2W: 1-hour candles
  '30':  { interval: 14400,  duration: 30 * 86400 },  // 1M: 4-hour candles
  '90':  { interval: 86400,  duration: 90 * 86400 },  // 3M: daily candles
  '180': { interval: 86400,  duration: 180 * 86400 }, // 6M: daily candles
  '365': { interval: 86400,  duration: 365 * 86400 }, // 1Y: daily candles
  'max': { interval: 86400,  duration: 365 * 86400 }, // ALL: daily candles
}

// Seeded PRNG for deterministic data
function createRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s & 0x7fffffff) / 0x7fffffff
  }
}

interface TokenPriceConfig {
  endPrice: number
  volatility: number
  yearlyTrend: number // fraction: 0.5 = 50% up over a year
}

const TOKEN_CONFIGS: Record<string, TokenPriceConfig> = {
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { endPrice: 67842, volatility: 0.025, yearlyTrend: 0.5 },
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { endPrice: 3512, volatility: 0.03, yearlyTrend: 0.6 },
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': { endPrice: 1.0, volatility: 0.001, yearlyTrend: 0.0 },
  '0x0000000000000000000000000000000000001010': { endPrice: 0.874, volatility: 0.04, yearlyTrend: 0.7 },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { endPrice: 412, volatility: 0.028, yearlyTrend: 0.45 },
}

function generateCandles(
  config: TokenPriceConfig,
  interval: number,
  duration: number,
): OHLCCandle[] {
  const startTime = END_TIME - duration
  const numCandles = Math.floor(duration / interval)

  // Work backwards from endPrice to derive startPrice
  const startPrice = config.endPrice / (1 + config.yearlyTrend * (duration / (365 * 86400)))

  // Use interval + endPrice as seed for determinism per granularity
  const rand = createRng(Math.round(config.endPrice * 100) + interval)

  const candles: OHLCCandle[] = []
  let price = startPrice

  // Scale volatility to interval (smaller intervals = smaller moves)
  const intervalDays = interval / 86400
  const scaledVol = config.volatility * Math.sqrt(intervalDays)

  for (let i = 0; i < numCandles; i++) {
    const trendPerCandle = (config.yearlyTrend * price) / (365 * 86400 / interval)
    const change = (rand() - 0.48) * scaledVol * price + trendPerCandle
    const open = price
    const close = Math.max(open * 0.9, open + change)
    const high = Math.max(open, close) * (1 + rand() * scaledVol * 0.5)
    const low = Math.min(open, close) * (1 - rand() * scaledVol * 0.5)

    candles.push({
      time: startTime + i * interval,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    price = close
  }

  return candles
}

export function getMockCandles(tokenAddress: string, timeRange?: string): OHLCCandle[] {
  const config = TOKEN_CONFIGS[tokenAddress] ?? TOKEN_CONFIGS['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599']
  const range = RANGE_CONFIGS[timeRange ?? 'max'] ?? RANGE_CONFIGS['max']
  return generateCandles(config, range.interval, range.duration)
}

// --- Per-token trades ---

const TRADES_BY_TOKEN: Record<string, Trade[]> = {
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': [
    makeTrade('0xwbtc01', '2025-06-15T10:23:45.000Z', 'buy', 0.5, 'WBTC', 8, 29500, 1.35, 1.34),
    makeTrade('0xwbtc02', '2025-08-22T14:05:12.000Z', 'buy', 1.0, 'WBTC', 8, 52100, 1.36, 1.34),
    makeTrade('0xwbtc03', '2025-11-30T08:44:30.000Z', 'sell', 0.25, 'WBTC', 8, 15800, 1.33, 1.34),
    makeTrade('0xwbtc04', '2026-01-08T16:20:00.000Z', 'buy', 0.5, 'WBTC', 8, 31200, 1.35, 1.34),
    makeTrade('0xwbtc05', '2026-02-14T09:15:22.000Z', 'sell', 0.25, 'WBTC', 8, 16900, 1.34, 1.34),
    makeTrade('0xwbtc06', '2026-03-20T11:30:00.000Z', 'buy', 0.5, 'WBTC', 8, 33900, 1.34, 1.34),
  ],
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': [
    makeTrade('0xeth01', '2025-05-10T09:00:00.000Z', 'buy', 2.0, 'ETH', 18, 5200, 1.36, 1.34),
    makeTrade('0xeth02', '2025-07-18T15:30:00.000Z', 'buy', 1.5, 'ETH', 18, 4350, 1.35, 1.34),
    makeTrade('0xeth03', '2025-10-05T12:00:00.000Z', 'sell', 0.8, 'ETH', 18, 2480, 1.33, 1.34),
    makeTrade('0xeth04', '2026-01-20T10:45:00.000Z', 'buy', 1.5, 'ETH', 18, 4800, 1.35, 1.34),
  ],
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': [
    makeTrade('0xusdc01', '2025-04-01T08:00:00.000Z', 'buy', 3000, 'USDC', 6, 3000, 1.36, 1.34),
    makeTrade('0xusdc02', '2025-09-15T14:00:00.000Z', 'buy', 2200, 'USDC', 6, 2200, 1.34, 1.34),
  ],
  '0x0000000000000000000000000000000000001010': [
    makeTrade('0xpol01', '2025-06-01T11:00:00.000Z', 'buy', 2000, 'POL', 18, 1100, 1.35, 1.34),
    makeTrade('0xpol02', '2025-08-20T16:00:00.000Z', 'buy', 1500, 'POL', 18, 1050, 1.36, 1.34),
    makeTrade('0xpol03', '2026-02-10T09:30:00.000Z', 'sell', 500, 'POL', 18, 400, 1.33, 1.34),
  ],
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': [
    makeTrade('0xbnb01', '2025-07-05T10:00:00.000Z', 'buy', 1.5, 'WBNB', 18, 450, 1.35, 1.34),
    makeTrade('0xbnb02', '2025-12-01T13:00:00.000Z', 'buy', 1.3, 'WBNB', 18, 480, 1.34, 1.34),
    makeTrade('0xbnb03', '2026-03-10T08:00:00.000Z', 'sell', 0.5, 'WBNB', 18, 206, 1.34, 1.34),
  ],
}

function makeTrade(
  hash: string,
  timestamp: string,
  type: 'buy' | 'sell',
  amount: number,
  symbol: string,
  decimals: number,
  usdValue: number,
  fxThen: number,
  fxNow: number,
): Trade {
  const sgdThen = Math.round(usdValue * fxThen * 100) / 100
  const sgdNow = Math.round(usdValue * fxNow * 100) / 100
  return {
    transactionHash: hash.padEnd(66, '0'),
    blockTimestamp: timestamp,
    fromAddress: type === 'buy' ? '0x0000000000000000000000000000000000000000' : '0xDemo1234567890',
    toAddress: type === 'buy' ? '0xDemo1234567890' : '0x0000000000000000000000000000000000000000',
    value: String(amount * 10 ** decimals),
    valueFormatted: amount,
    tokenSymbol: symbol,
    tokenDecimals: decimals,
    type,
    usdValue,
    sgdThen,
    sgdNow,
    fxImpact: Math.round((sgdNow - sgdThen) * 100) / 100,
  }
}

export function getMockTrades(tokenAddress: string): Trade[] {
  return TRADES_BY_TOKEN[tokenAddress] ?? []
}

export const MOCK_FX_RATE = 1.34
