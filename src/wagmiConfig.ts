import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, arbitrum, polygon, bsc } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'CryptoFolio',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, arbitrum, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
})
