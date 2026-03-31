import { useQuery } from '@tanstack/react-query'
import { fetchTokenBalances } from '../lib/moralis'
import { ALL_CHAINS } from '../lib/chains'
import type { TokenBalance, ChainKey } from '../types'

export function useTokenBalances(address: string | undefined) {
  return useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address) return []

      const results = await Promise.all(
        ALL_CHAINS.map(async (chain) => {
          const balances = await fetchTokenBalances(address, chain.moralisChain)
          return balances.map((b) => ({
            tokenAddress: b.token_address,
            symbol: b.symbol,
            name: b.name,
            decimals: b.decimals,
            balance: b.balance,
            balanceFormatted: b.balance_formatted,
            usdPrice: b.usd_price,
            usdValue: b.usd_value,
            usdPrice24hrPercentChange: b.usd_price_24hr_percent_change,
            chain: chain.key as ChainKey,
            logo: b.logo ?? undefined,
          }))
        }),
      )

      return results.flat().sort((a, b) => b.usdValue - a.usdValue)
    },
    enabled: !!address,
  })
}
