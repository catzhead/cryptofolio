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
