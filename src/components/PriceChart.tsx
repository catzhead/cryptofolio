import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
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

function tradeTimeToCandle(timestamp: string): Time {
  // Snap to midnight UTC to align with daily candle timestamps
  const ms = new Date(timestamp).getTime()
  const dayMs = 86400 * 1000
  return (Math.floor(ms / dayMs) * dayMs / 1000) as Time
}

function tradesToMarkers(trades: Trade[]): SeriesMarker<Time>[] {
  return trades.map((trade, index) => ({
    time: tradeTimeToCandle(trade.blockTimestamp),
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
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

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

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ade80',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series
    markersRef.current = createSeriesMarkers(series)

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
      markersRef.current = null
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
    markersRef.current?.setMarkers(tradesToMarkers(trades))
    chartRef.current?.timeScale().fitContent()
  }, [candles, trades])

  useEffect(() => {
    if (selectedTradeIndex === null || !chartRef.current || !seriesRef.current || !trades[selectedTradeIndex]) return

    const trade = trades[selectedTradeIndex]
    const targetTime = tradeTimeToCandle(trade.blockTimestamp) as Time

    // Find the bar index for this time and scroll to center it, preserving zoom
    const data = seriesRef.current.data()
    const barIndex = data.findIndex((d) => (d.time as number) >= (targetTime as number))
    if (barIndex >= 0) {
      const visibleRange = chartRef.current.timeScale().getVisibleLogicalRange()
      if (visibleRange) {
        const barsVisible = visibleRange.to - visibleRange.from
        const centerOffset = barsVisible / 2
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: barIndex - centerOffset,
          to: barIndex + centerOffset,
        })
      }
    }
  }, [selectedTradeIndex, trades])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
    />
  )
}
