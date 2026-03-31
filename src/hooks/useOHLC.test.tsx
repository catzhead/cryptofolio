import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useOHLC } from './useOHLC'
import * as coingecko from '../lib/coingecko'

vi.mock('../lib/coingecko')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOHLC', () => {
  it('resolves coingecko ID then fetches OHLC data', async () => {
    vi.mocked(coingecko.resolveCoingeckoId).mockResolvedValue('wrapped-bitcoin')
    vi.mocked(coingecko.fetchOHLC).mockResolvedValue([
      { time: 1710460800, open: 71234, high: 71500, low: 71100, close: 71345 },
    ])

    const { result } = renderHook(
      () => useOHLC('0xabc', 'ethereum', '30'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].close).toBe(71345)
  })
})
