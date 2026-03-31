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
