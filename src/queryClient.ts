import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
    },
  },
})

queryClient.setQueryDefaults(['tokenBalances'], {
  staleTime: 1000 * 60,
})

queryClient.setQueryDefaults(['ohlc'], {
  staleTime: 1000 * 60 * 5,
})

queryClient.setQueryDefaults(['tradeHistory'], {
  staleTime: 1000 * 60 * 30,
})

queryClient.setQueryDefaults(['fxRate', 'historical'], {
  staleTime: Infinity,
})

queryClient.setQueryDefaults(['fxRate', 'current'], {
  staleTime: 1000 * 60 * 60,
})

queryClient.setQueryDefaults(['coingeckoId'], {
  staleTime: Infinity,
})

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const value = await get(key)
      return value ?? null
    },
    setItem: async (key, value) => {
      await set(key, value)
    },
    removeItem: async (key) => {
      await del(key)
    },
  },
  throttleTime: 1000,
  key: 'cryptofolio-cache',
})
