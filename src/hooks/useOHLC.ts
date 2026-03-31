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
