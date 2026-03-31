import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTokenBalances } from './useTokenBalances'
import * as moralis from '../lib/moralis'

vi.mock('../lib/moralis')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTokenBalances', () => {
  it('fetches balances across all chains and returns unified list', async () => {
    vi.mocked(moralis.fetchTokenBalances).mockResolvedValue([
      {
        token_address: '0xabc',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        balance: '100000000',
        balance_formatted: '1.0',
        usd_price: 67000,
        usd_price_24hr_percent_change: 2.5,
        usd_value: 67000,
        logo: null,
        possible_spam: false,
      },
    ])

    const { result } = renderHook(() => useTokenBalances('0x1234'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(moralis.fetchTokenBalances).toHaveBeenCalledTimes(4)
    expect(result.current.data!.length).toBeGreaterThanOrEqual(1)
    expect(result.current.data![0].symbol).toBe('WBTC')
    expect(result.current.data![0].chain).toBeDefined()
  })
})
