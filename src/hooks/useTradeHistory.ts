import { useQuery } from '@tanstack/react-query'
import { fetchTokenTransfers, fetchNativeTransfers } from '../lib/moralis'
import { fetchHistoricalPrice, isNativeToken } from '../lib/coingecko'
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

      const currentFXRate = await fetchCurrentFXRate()

      const trades = await Promise.all(
        transfers.map(async (t) => {
          const decimals = parseInt(t.token_decimals, 10)
          const valueFormatted = parseInt(t.value, 10) / 10 ** decimals
          const type: 'buy' | 'sell' =
            t.to_address.toLowerCase() === address!.toLowerCase() ? 'buy' : 'sell'

          const date = t.block_timestamp.split('T')[0]
          const [usdPrice, fxRate] = await Promise.all([
            fetchHistoricalPrice(coinId!, date),
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
    enabled: !!address && !!chain && !!tokenAddress && !!coinId,
    retry: 1,
  })
}
