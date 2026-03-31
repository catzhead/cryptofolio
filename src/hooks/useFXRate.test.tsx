import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCurrentFXRate } from './useFXRate'
import * as fx from '../lib/fx'

vi.mock('../lib/fx')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useCurrentFXRate', () => {
  it('fetches current USD/SGD rate', async () => {
    vi.mocked(fx.fetchCurrentFXRate).mockResolvedValue(1.34)

    const { result } = renderHook(() => useCurrentFXRate(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(1.34)
  })
})
