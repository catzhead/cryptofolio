import { useQuery } from '@tanstack/react-query'
import { resolveCoingeckoId, fetchOHLC, fetchOHLCRange } from '../lib/coingecko'
import { CHAINS } from '../lib/chains'
import type { ChainKey, OHLCCandle } from '../types'

export function useCoingeckoId(tokenAddress: string | undefined, chain: ChainKey | undefined) {
  return useQuery({
    queryKey: ['coingeckoId', chain, tokenAddress],
    queryFn: () => resolveCoingeckoId(CHAINS[chain!].coingeckoPlatform, tokenAddress!),
    enabled: !!tokenAddress && !!chain,
    staleTime: Infinity,
  })
}

// Duration and candle interval per time range (in seconds)
const RANGE_INTERVALS: Record<string, { duration: number; interval: number }> = {
  '1':   { duration: 86400,          interval: 300 },
  '7':   { duration: 7 * 86400,      interval: 1800 },
  '14':  { duration: 14 * 86400,     interval: 3600 },
  '30':  { duration: 30 * 86400,     interval: 14400 },
  '90':  { duration: 90 * 86400,     interval: 86400 },
  '180': { duration: 180 * 86400,    interval: 86400 },
  '365': { duration: 365 * 86400,    interval: 86400 },
  'max': { duration: 365 * 86400,    interval: 86400 },
}

export function useOHLC(
  coinId: string | undefined,
  days: string,
  centerTime?: number | null,
) {
  return useQuery<OHLCCandle[]>({
    queryKey: ['ohlc', coinId, days, centerTime ?? 'now'],
    queryFn: () => {
      if (centerTime) {
        // Fetch candles for an arbitrary window centered on centerTime
        const config = RANGE_INTERVALS[days] ?? RANGE_INTERVALS['max']
        const halfDuration = config.duration / 2
        const from = centerTime - halfDuration
        const to = centerTime + halfDuration
        return fetchOHLCRange(coinId!, from, to, config.interval)
      }
      // Default: last N days from CoinGecko
      return fetchOHLC(coinId!, days)
    },
    enabled: !!coinId,
  })
}
