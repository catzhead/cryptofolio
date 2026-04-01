import type { OHLCCandle } from '../types'

const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY
const BASE = API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3'

function headers(): HeadersInit {
  if (API_KEY) return { 'x-cg-demo-api-key': API_KEY }
  return {}
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: headers() })
    if (res.status === 429) {
      const wait = Math.pow(2, i + 1) * 1000
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    return res
  }
  return fetch(url, { headers: headers() })
}

export async function fetchOHLC(
  coinId: string,
  days: string,
): Promise<OHLCCandle[]> {
  const url = `${BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
  const res = await fetchWithRetry(url)
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

// Fetch price data for an arbitrary date range and aggregate into OHLC candles
export async function fetchOHLCRange(
  coinId: string,
  fromUnix: number,
  toUnix: number,
  intervalSeconds: number,
): Promise<OHLCCandle[]> {
  const url = `${BASE}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromUnix}&to=${toUnix}`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`CoinGecko market_chart/range error: ${res.status}`)

  const data: { prices: [number, number][] } = await res.json()
  if (!data.prices.length) return []

  // Aggregate price points into OHLC buckets
  const candles: OHLCCandle[] = []
  const bucketStart = Math.floor(fromUnix / intervalSeconds) * intervalSeconds

  let currentBucket = bucketStart
  let open = data.prices[0][1]
  let high = open
  let low = open
  let close = open

  for (const [timestampMs, price] of data.prices) {
    const timeSec = Math.floor(timestampMs / 1000)
    const bucket = Math.floor(timeSec / intervalSeconds) * intervalSeconds

    if (bucket !== currentBucket) {
      candles.push({ time: currentBucket, open, high, low, close })
      currentBucket = bucket
      open = price
      high = price
      low = price
    }
    high = Math.max(high, price)
    low = Math.min(low, price)
    close = price
  }
  // Push last bucket
  candles.push({ time: currentBucket, open, high, low, close })

  return candles
}

export async function fetchHistoricalPrice(
  coinId: string,
  isoDate: string,
): Promise<number> {
  const [year, month, day] = isoDate.split('-')
  const cgDate = `${day}-${month}-${year}`
  const url = `${BASE}/coins/${coinId}/history?date=${cgDate}&localization=false`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`CoinGecko history error: ${res.status}`)

  const data = await res.json()
  return data.market_data.current_price.usd
}

// Fetch full price history for a date range in a single call
// Returns a map of ISO date → USD price (closest daily price)
export async function fetchPriceRange(
  coinId: string,
  fromUnix: number,
  toUnix: number,
): Promise<Map<string, number>> {
  const url = `${BASE}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromUnix}&to=${toUnix}`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`CoinGecko price range error: ${res.status}`)

  const data: { prices: [number, number][] } = await res.json()
  const priceMap = new Map<string, number>()

  for (const [timestampMs, price] of data.prices) {
    const date = new Date(timestampMs).toISOString().split('T')[0]
    // Keep the last price point for each date (closest to end of day)
    priceMap.set(date, price)
  }

  return priceMap
}

// Look up price for a date from a pre-fetched price map
// Falls back to nearest available date
export function lookupPrice(priceMap: Map<string, number>, isoDate: string): number {
  const exact = priceMap.get(isoDate)
  if (exact !== undefined) return exact

  // Find nearest date
  const target = new Date(isoDate).getTime()
  let bestDate = ''
  let bestDist = Infinity
  for (const [date] of priceMap) {
    const dist = Math.abs(new Date(date).getTime() - target)
    if (dist < bestDist) {
      bestDist = dist
      bestDate = date
    }
  }
  return priceMap.get(bestDate) ?? 0
}

// Native tokens use placeholder addresses from Moralis — map them directly
const NATIVE_COINGECKO_IDS: Record<string, Record<string, string>> = {
  ethereum: {
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
  },
  'polygon-pos': {
    '0x0000000000000000000000000000000000001010': 'matic-network',
  },
  'binance-smart-chain': {
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'wbnb',
  },
  'arbitrum-one': {
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
  },
}

export function isNativeToken(platform: string, contractAddress: string): boolean {
  return !!NATIVE_COINGECKO_IDS[platform]?.[contractAddress.toLowerCase()]
}

export async function resolveCoingeckoId(
  platform: string,
  contractAddress: string,
): Promise<string> {
  const addr = contractAddress.toLowerCase()

  // Check native token mapping first
  const nativeId = NATIVE_COINGECKO_IDS[platform]?.[addr]
  if (nativeId) return nativeId

  const url = `${BASE}/coins/${platform}/contract/${addr}`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`CoinGecko contract lookup error: ${res.status}`)

  const data = await res.json()
  return data.id
}
