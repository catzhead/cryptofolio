import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOHLC, fetchHistoricalPrice, resolveCoingeckoId } from './coingecko'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchOHLC', () => {
  it('fetches OHLC data and transforms to candle format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        [1710460800000, 71234.56, 71500.0, 71100.0, 71345.12],
        [1710462600000, 71345.12, 71600.0, 71200.0, 71420.0],
      ],
    })

    const result = await fetchOHLC('bitcoin', '7')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/coins/bitcoin/ohlc?vs_currency=usd&days=7'),
      expect.any(Object),
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      time: 1710460800,
      open: 71234.56,
      high: 71500.0,
      low: 71100.0,
      close: 71345.12,
    })
  })
})

describe('fetchHistoricalPrice', () => {
  it('fetches USD price at a specific date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        market_data: {
          current_price: { usd: 67234.5 },
        },
      }),
    })

    const price = await fetchHistoricalPrice('bitcoin', '2024-03-15')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/coins/bitcoin/history?date=15-03-2024'),
      expect.any(Object),
    )
    expect(price).toBe(67234.5)
  })
})

describe('resolveCoingeckoId', () => {
  it('maps a contract address to a CoinGecko ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'wrapped-bitcoin' }),
    })

    const id = await resolveCoingeckoId('ethereum', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')
    expect(id).toBe('wrapped-bitcoin')
  })
})
