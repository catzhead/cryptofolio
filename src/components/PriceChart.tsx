import { useEffect, useRef, useCallback, useState } from 'react'
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
  const ms = new Date(timestamp).getTime()
  const dayMs = 86400 * 1000
  return (Math.floor(ms / dayMs) * dayMs / 1000) as Time
}

function tradesToMarkers(trades: Trade[], selectedIndex: number | null): SeriesMarker<Time>[] {
  return trades.map((trade, index) => {
    const isSelected = index === selectedIndex
    const isBuy = trade.type === 'buy'
    return {
      time: tradeTimeToCandle(trade.blockTimestamp),
      position: isBuy ? 'belowBar' as const : 'aboveBar' as const,
      color: isSelected
        ? '#ffffff'
        : isBuy ? '#4ade80' : '#ef4444',
      shape: isBuy ? 'arrowUp' as const : 'arrowDown' as const,
      text: `${isBuy ? 'BUY' : 'SELL'} ${trade.valueFormatted}`,
      id: String(index),
      size: isSelected ? 2 : 1,
    }
  })
}

interface PingPosition {
  x: number
  y: number
  key: number
}

export function PriceChart({ candles, trades, selectedTradeIndex, onTradeClick }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const [ping, setPing] = useState<PingPosition | null>(null)

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

  // Update candle data
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
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  // Update markers when trades or selection changes
  useEffect(() => {
    if (!markersRef.current) return
    markersRef.current.setMarkers(tradesToMarkers(trades, selectedTradeIndex))
  }, [trades, selectedTradeIndex])

  // Pan to selected trade and show ping
  useEffect(() => {
    if (selectedTradeIndex === null || !chartRef.current || !seriesRef.current || !trades[selectedTradeIndex]) {
      setPing(null)
      return
    }

    const chart = chartRef.current
    const series = seriesRef.current
    const trade = trades[selectedTradeIndex]
    const targetTime = tradeTimeToCandle(trade.blockTimestamp) as Time

    // Pan to center on the trade
    const data = series.data()
    const barIndex = data.findIndex((d) => (d.time as number) >= (targetTime as number))
    if (barIndex >= 0) {
      const visibleRange = chart.timeScale().getVisibleLogicalRange()
      if (visibleRange) {
        const barsVisible = visibleRange.to - visibleRange.from
        const centerOffset = barsVisible / 2
        chart.timeScale().setVisibleLogicalRange({
          from: barIndex - centerOffset,
          to: barIndex + centerOffset,
        })
      }
    }

    // Calculate pixel position for the ping
    const timeCoord = chart.timeScale().timeToCoordinate(targetTime)
    const bar = data.find((d) => (d.time as number) === (targetTime as number)) as CandlestickData<Time> | undefined
    if (timeCoord !== null && bar) {
      const price = trade.type === 'buy' ? bar.low : bar.high
      const priceCoord = series.priceToCoordinate(price)
      if (priceCoord !== null) {
        setPing({ x: timeCoord, y: priceCoord, key: Date.now() })
      }
    }
  }, [selectedTradeIndex, trades])

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden relative">
      {ping && (
        <div
          key={ping.key}
          className="absolute pointer-events-none"
          style={{ left: ping.x, top: ping.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-3 h-3 rounded-full bg-white opacity-80" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping" />
          <div
            className="absolute rounded-full border-2 border-white opacity-0"
            style={{
              width: 40,
              height: 40,
              left: -14,
              top: -14,
              animation: 'radar-ring 1s ease-out forwards',
            }}
          />
          <div
            className="absolute rounded-full border-2 border-white opacity-0"
            style={{
              width: 40,
              height: 40,
              left: -14,
              top: -14,
              animation: 'radar-ring 1s ease-out 0.3s forwards',
            }}
          />
        </div>
      )}
    </div>
  )
}
