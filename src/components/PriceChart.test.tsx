import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PriceChart } from './PriceChart'
import type { OHLCCandle, Trade } from '../types'

vi.mock('lightweight-charts', () => {
  const mockSeries = {
    setData: vi.fn(),
    setMarkers: vi.fn(),
  }
  const mockTimeScale = {
    fitContent: vi.fn(),
    setVisibleRange: vi.fn(),
  }
  const mockChart = {
    addCandlestickSeries: vi.fn(() => mockSeries),
    timeScale: vi.fn(() => mockTimeScale),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    subscribeClick: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
  }
  return {
    createChart: vi.fn(() => mockChart),
    ColorType: { Solid: 'Solid' },
  }
})

const candles: OHLCCandle[] = [
  { time: 1710460800, open: 71234, high: 71500, low: 71100, close: 71345 },
  { time: 1710547200, open: 71345, high: 71600, low: 71200, close: 71420 },
]

const trades: Trade[] = [
  {
    transactionHash: '0xtx1',
    blockTimestamp: '2024-03-15T10:30:00.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '50000000',
    valueFormatted: 0.5,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 35617,
  },
]

describe('PriceChart', () => {
  it('renders a chart container', () => {
    const { container } = render(
      <PriceChart
        candles={candles}
        trades={trades}
        selectedTradeIndex={null}
        onTradeClick={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('calls createChart on mount', async () => {
    const { createChart } = await import('lightweight-charts')
    render(
      <PriceChart
        candles={candles}
        trades={trades}
        selectedTradeIndex={null}
        onTradeClick={vi.fn()}
      />,
    )
    expect(createChart).toHaveBeenCalled()
  })
})
