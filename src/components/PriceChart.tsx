import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'
import type { OHLCCandle, Trade } from '../types'

interface PriceChartProps {
  candles: OHLCCandle[]
  trades: Trade[]
  selectedTradeIndex: number | null
  onTradeClick: (index: number) => void
}

function tradesToMarkers(trades: Trade[]): SeriesMarker<Time>[] {
  return trades.map((trade, index) => ({
    time: (Math.floor(new Date(trade.blockTimestamp).getTime() / 1000)) as Time,
    position: trade.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
    color: trade.type === 'buy' ? '#4ade80' : '#ef4444',
    shape: trade.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
    text: `${trade.type === 'buy' ? 'BUY' : 'SELL'} ${trade.valueFormatted}`,
    id: String(index),
  }))
}

export function PriceChart({ candles, trades, selectedTradeIndex, onTradeClick }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const handleClick = useCallback(
    (param: any) => {
      if (param.hoveredObjectId != null) {
        const index = parseInt(param.hoveredObjectId, 10)
        if (!isNaN(index)) {
          onTradeClick(index)
        }
      }
    },
    [onTradeClick],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a1a' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: '#1e1e3a' },
        horzLines: { color: '#1e1e3a' },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: {
        vertLine: { color: '#ffffff33', style: 3 },
        horzLine: { color: '#ffffff33', style: 3 },
      },
    })

    const series = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series

    chart.subscribeClick(handleClick)

    chart.subscribeCrosshairMove((param: any) => {
      if (containerRef.current) {
        containerRef.current.style.cursor = param.hoveredObjectId != null ? 'pointer' : 'default'
      }
    })

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [handleClick])

  useEffect(() => {
    if (!seriesRef.current) return
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    seriesRef.current.setData(data)
    seriesRef.current.setMarkers(tradesToMarkers(trades))
    chartRef.current?.timeScale().fitContent()
  }, [candles, trades])

  useEffect(() => {
    if (selectedTradeIndex === null || !chartRef.current || !trades[selectedTradeIndex]) return

    const trade = trades[selectedTradeIndex]
    const targetTime = Math.floor(new Date(trade.blockTimestamp).getTime() / 1000)
    const dayInSeconds = 86400
    const offset = 15 * dayInSeconds

    chartRef.current.timeScale().setVisibleRange({
      from: (targetTime - offset) as Time,
      to: (targetTime + offset) as Time,
    })
  }, [selectedTradeIndex, trades])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
    />
  )
}
