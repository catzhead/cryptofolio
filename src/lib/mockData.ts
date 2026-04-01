import type { TokenBalance, Trade, OHLCCandle } from '../types'

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

const DAY = 86400
// 365 days ending ~2026-03-31
const END_TIME = 1774915200 // 2026-03-31 00:00:00 UTC
const START_TIME = END_TIME - 365 * DAY

function generateCandles(
  startPrice: number,
  volatility: number,
  trend: number,
  days: number,
): OHLCCandle[] {
  const candles: OHLCCandle[] = []
  let price = startPrice
  // Seeded pseudo-random for determinism
  let seed = Math.round(startPrice * 100)
  function rand() {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed & 0x7fffffff) / 0x7fffffff
  }

  for (let i = 0; i < days; i++) {
    const dailyTrend = trend / days
    const change = (rand() - 0.48) * volatility + dailyTrend * price
    const open = price
    const close = Math.max(open * 0.8, open + change)
    const high = Math.max(open, close) * (1 + rand() * volatility * 0.3)
    const low = Math.min(open, close) * (1 - rand() * volatility * 0.3)
    candles.push({
      time: START_TIME + i * DAY,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    price = close
  }
  return candles
}

// Per-token candle data: 365 daily candles each
const CANDLES_BY_TOKEN: Record<string, OHLCCandle[]> = {
  // WBTC: ~$45k → ~$68k over a year
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': generateCandles(45000, 0.025, 0.5, 365),
  // ETH: ~$2200 → ~$3500
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': generateCandles(2200, 0.03, 0.6, 365),
  // USDC: ~$1.00 stable
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': generateCandles(1.0, 0.001, 0.0, 365),
  // POL: ~$0.50 → ~$0.87
  '0x0000000000000000000000000000000000001010': generateCandles(0.50, 0.04, 0.7, 365),
  // WBNB: ~$280 → ~$412
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': generateCandles(280, 0.028, 0.45, 365),
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

// --- Public API ---

export function getMockCandles(tokenAddress: string, timeRange?: string): OHLCCandle[] {
  const allCandles = CANDLES_BY_TOKEN[tokenAddress] ?? CANDLES_BY_TOKEN['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599']
  if (!timeRange || timeRange === 'max') return allCandles

  const days = parseInt(timeRange, 10)
  if (isNaN(days)) return allCandles

  return allCandles.slice(-days)
}

export function getMockTrades(tokenAddress: string): Trade[] {
  return TRADES_BY_TOKEN[tokenAddress] ?? []
}

export const MOCK_FX_RATE = 1.34
