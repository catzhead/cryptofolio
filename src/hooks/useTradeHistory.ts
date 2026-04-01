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

      let transfers
      try {
        transfers = native
          ? await fetchNativeTransfers(address!, chainConfig.moralisChain)
          : await fetchTokenTransfers(address!, chainConfig.moralisChain, tokenAddress!)
      } catch (e) {
        throw new Error(`[1/3 Moralis ${native ? 'native' : 'erc20'}] ${e instanceof Error ? e.message : e}`)
      }

      if (transfers.length === 0) return []

      let currentFXRate: number
      try {
        currentFXRate = await fetchCurrentFXRate()
      } catch (e) {
        throw new Error(`[2/3 FX rate] ${e instanceof Error ? e.message : e}`)
      }

      // Process trades sequentially to avoid CoinGecko rate limits
      const trades: Trade[] = []
      for (let i = 0; i < transfers.length; i++) {
        const t = transfers[i]
        const decimals = parseInt(t.token_decimals, 10)
        const valueFormatted = parseInt(t.value, 10) / 10 ** decimals
        const type: 'buy' | 'sell' =
          t.to_address.toLowerCase() === address!.toLowerCase() ? 'buy' : 'sell'

        const date = t.block_timestamp.split('T')[0]
        let usdPrice: number, fxRate: number
        try {
          ;[usdPrice, fxRate] = await Promise.all([
            fetchHistoricalPrice(coinId!, date),
            fetchFXRate(date),
          ])
        } catch (e) {
          throw new Error(`[3/3 enriching trade ${i}, date=${date}] ${e instanceof Error ? e.message : e}`)
        }

        const usdValue = valueFormatted * usdPrice
        const sgdThen = usdValue * fxRate
        const sgdNow = usdValue * currentFXRate
        const fxImpact = sgdNow - sgdThen

        trades.push({
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
        })
      }

      return trades
    },
    enabled: !!address && !!chain && !!tokenAddress && !!coinId,
    retry: 1,
  })
}
