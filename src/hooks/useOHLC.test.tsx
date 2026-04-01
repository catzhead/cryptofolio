import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useOHLC } from './useOHLC'
import * as coingecko from '../lib/coingecko'

vi.mock('../lib/coingecko')

beforeEach(() => {
  vi.clearAllMocks()
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOHLC', () => {
  it('fetches OHLC data for coinId and days', async () => {
    vi.mocked(coingecko.fetchOHLC).mockResolvedValue([
      { time: 1710460800, open: 71234, high: 71500, low: 71100, close: 71345 },
    ])

    const { result } = renderHook(
      () => useOHLC('wrapped-bitcoin', '30'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].close).toBe(71345)
  })

  it('uses fetchOHLCRange when centerTime is provided', async () => {
    vi.mocked(coingecko.fetchOHLCRange).mockResolvedValue([
      { time: 1710460800, open: 65000, high: 66000, low: 64000, close: 65500 },
    ])

    const centerTime = 1710460800
    const { result } = renderHook(
      () => useOHLC('wrapped-bitcoin', '1', centerTime),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(coingecko.fetchOHLCRange).toHaveBeenCalledTimes(1)
    expect(coingecko.fetchOHLC).not.toHaveBeenCalled()
    expect(result.current.data).toHaveLength(1)
  })
})
