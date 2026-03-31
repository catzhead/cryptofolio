import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFXRate, fetchCurrentFXRate } from './fx'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchFXRate', () => {
  it('fetches historical USD/SGD rate for a date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { SGD: 1.3425 } }),
    })

    const rate = await fetchFXRate('2024-03-15')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/2024-03-15?base=USD&symbols=SGD',
    )
    expect(rate).toBe(1.3425)
  })
})

describe('fetchCurrentFXRate', () => {
  it('fetches today USD/SGD rate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { SGD: 1.3401 } }),
    })

    const rate = await fetchCurrentFXRate()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD',
    )
    expect(rate).toBe(1.3401)
  })
})
