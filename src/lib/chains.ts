import type { ChainKey } from '../types'

export interface ChainConfig {
  key: ChainKey
  name: string
  moralisChain: string
  coingeckoPlatform: string
  wagmiChainId: number
}

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    moralisChain: 'eth',
    coingeckoPlatform: 'ethereum',
    wagmiChainId: 1,
  },
  arbitrum: {
    key: 'arbitrum',
    name: 'Arbitrum',
    moralisChain: 'arbitrum',
    coingeckoPlatform: 'arbitrum-one',
    wagmiChainId: 42161,
  },
  polygon: {
    key: 'polygon',
    name: 'Polygon',
    moralisChain: 'polygon',
    coingeckoPlatform: 'polygon-pos',
    wagmiChainId: 137,
  },
  bsc: {
    key: 'bsc',
    name: 'BSC',
    moralisChain: 'bsc',
    coingeckoPlatform: 'binance-smart-chain',
    wagmiChainId: 56,
  },
}

export const ALL_CHAINS = Object.values(CHAINS)
