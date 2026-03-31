import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTradeHistory } from './useTradeHistory'
import * as moralis from '../lib/moralis'
import * as coingecko from '../lib/coingecko'
import * as fx from '../lib/fx'

vi.mock('../lib/moralis')
vi.mock('../lib/coingecko')
vi.mock('../lib/fx')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTradeHistory', () => {
  it('fetches transfers and enriches with USD and FX data', async () => {
    vi.mocked(moralis.fetchTokenTransfers).mockResolvedValue([
      {
        transaction_hash: '0xtx1',
        block_timestamp: '2024-03-15T10:30:00.000Z',
        from_address: '0xother',
        to_address: '0x1234',
        value: '50000000',
        token_symbol: 'WBTC',
        token_decimals: '8',
      },
    ])
    vi.mocked(coingecko.resolveCoingeckoId).mockResolvedValue('wrapped-bitcoin')
    vi.mocked(coingecko.fetchHistoricalPrice).mockResolvedValue(67000)
    vi.mocked(fx.fetchFXRate).mockResolvedValue(1.34)
    vi.mocked(fx.fetchCurrentFXRate).mockResolvedValue(1.32)

    const { result } = renderHook(
      () => useTradeHistory('0x1234', 'ethereum', '0xabc'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const trade = result.current.data![0]
    expect(trade.type).toBe('buy')
    expect(trade.valueFormatted).toBe(0.5)
    expect(trade.usdValue).toBeCloseTo(33500)
    expect(trade.sgdThen).toBeCloseTo(33500 * 1.34)
    expect(trade.sgdNow).toBeCloseTo(33500 * 1.32)
    expect(trade.fxImpact).toBeCloseTo(33500 * 1.32 - 33500 * 1.34)
  })
})
