import { useQuery } from '@tanstack/react-query'
import { fetchTokenTransfers, fetchNativeTransfers } from '../lib/moralis'
import { fetchPriceRange, lookupPrice, isNativeToken } from '../lib/coingecko'
import { fetchFXRate, fetchCurrentFXRate } from '../lib/fx'
import { CHAINS } from '../lib/chains'
import type { ChainKey, Trade } from '../types'

export function useTradeHistory(
  address: string | undefined,
  chain: ChainKey | undefined,
  tokenAddress: string | undefined,
  coinId: string | undefined,
) {
  return useQuery({
    queryKey: ['tradeHistory', address, chain, tokenAddress],
    queryFn: async (): Promise<Trade[]> => {
      const chainConfig = CHAINS[chain!]
      const native = isNativeToken(chainConfig.coingeckoPlatform, tokenAddress!)

      const transfers = native
        ? await fetchNativeTransfers(address!, chainConfig.moralisChain)
        : await fetchTokenTransfers(address!, chainConfig.moralisChain, tokenAddress!)

      if (transfers.length === 0) return []

      // Single CoinGecko call for the entire date range
      const timestamps = transfers.map((t) => Math.floor(new Date(t.block_timestamp).getTime() / 1000))
      const fromUnix = Math.min(...timestamps) - 86400 // 1 day buffer
      const toUnix = Math.max(...timestamps) + 86400
      const priceMap = await fetchPriceRange(coinId!, fromUnix, toUnix)

      // Fetch FX rates — Frankfurter has no rate limit issues
      const uniqueDates = [...new Set(transfers.map((t) => t.block_timestamp.split('T')[0]))]
      const [currentFXRate, ...fxRates] = await Promise.all([
        fetchCurrentFXRate(),
        ...uniqueDates.map((d) => fetchFXRate(d)),
      ])
      const fxByDate: Record<string, number> = {}
      uniqueDates.forEach((d, i) => { fxByDate[d] = fxRates[i] })

      return transfers.map((t) => {
        const decimals = parseInt(t.token_decimals, 10)
        const valueFormatted = parseInt(t.value, 10) / 10 ** decimals
        const type: 'buy' | 'sell' =
          t.to_address.toLowerCase() === address!.toLowerCase() ? 'buy' : 'sell'

        const date = t.block_timestamp.split('T')[0]
        const usdPrice = lookupPrice(priceMap, date)
        const fxRate = fxByDate[date]

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
      })
    },
    enabled: !!address && !!chain && !!tokenAddress && !!coinId,
    retry: 1,
  })
}
