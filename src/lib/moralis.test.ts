import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTokenBalances, fetchTokenTransfers } from './moralis'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchTokenBalances', () => {
  it('fetches token balances including native tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: [
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
            native_token: false,
            portfolio_percentage: 90,
          },
        ],
        cursor: null,
      }),
    })

    const result = await fetchTokenBalances('0x1234', 'eth')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/wallets/0x1234/tokens'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': expect.any(String) }),
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('WBTC')
    expect(result[0].balance_formatted).toBe('1.0')
  })

  it('filters out spam tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: [
          { token_address: '0xabc', symbol: 'WBTC', possible_spam: false, balance_formatted: '1.0', decimals: 8, balance: '100000000', usd_price: 67000, usd_price_24hr_percent_change: 0, usd_value: 67000, name: 'Wrapped Bitcoin', native_token: false, portfolio_percentage: 90 },
          { token_address: '0xspam', symbol: 'SCAM', possible_spam: true, balance_formatted: '999', decimals: 18, balance: '999000000000000000000', usd_price: 0, usd_price_24hr_percent_change: 0, usd_value: 0, name: 'Scam Token', native_token: false, portfolio_percentage: 10 },
        ],
        cursor: null,
      }),
    })

    const result = await fetchTokenBalances('0x1234', 'eth')
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('WBTC')
  })
})

describe('fetchTokenTransfers', () => {
  it('fetches token transfers and paginates', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cursor: 'page2cursor',
          result: [
            {
              transaction_hash: '0xtx1',
              block_timestamp: '2024-03-15T10:30:00.000Z',
              from_address: '0xother',
              to_address: '0x1234',
              value: '50000000',
              token_symbol: 'WBTC',
              token_decimals: '8',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cursor: null,
          result: [
            {
              transaction_hash: '0xtx2',
              block_timestamp: '2024-01-02T17:44:00.000Z',
              from_address: '0x1234',
              to_address: '0xother',
              value: '20000000',
              token_symbol: 'WBTC',
              token_decimals: '8',
            },
          ],
        }),
      })

    const result = await fetchTokenTransfers('0x1234', 'eth', '0xabc')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0].transaction_hash).toBe('0xtx1')
    expect(result[1].transaction_hash).toBe('0xtx2')
  })
})
