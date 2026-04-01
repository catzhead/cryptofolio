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

function tradeTimeToCandle(timestamp: string, candles: OHLCCandle[]): Time {
  const tradeSec = Math.floor(new Date(timestamp).getTime() / 1000)
  let best = candles[0]?.time ?? tradeSec
  for (const c of candles) {
    if (c.time <= tradeSec) best = c.time
    else break
  }
  return best as Time
}

function tradesToMarkers(trades: Trade[], candles: OHLCCandle[], selectedIndex: number | null): SeriesMarker<Time>[] {
  if (!candles.length) return []
  const startTime = candles[0].time
  const endTime = candles[candles.length - 1].time

  return trades
    .map((trade, index) => {
      const tradeSec = Math.floor(new Date(trade.blockTimestamp).getTime() / 1000)
      if (tradeSec < startTime || tradeSec > endTime) return null

      const isSelected = index === selectedIndex
      const isBuy = trade.type === 'buy'
      return {
        time: tradeTimeToCandle(trade.blockTimestamp, candles),
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
    .filter((m): m is SeriesMarker<Time> => m !== null)
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
    markersRef.current.setMarkers(tradesToMarkers(trades, candles, selectedTradeIndex))
  }, [trades, candles, selectedTradeIndex])

  // Pan to selected trade
  useEffect(() => {
    if (selectedTradeIndex === null || !chartRef.current || !seriesRef.current || !trades[selectedTradeIndex]) return

    const chart = chartRef.current
    const series = seriesRef.current
    const trade = trades[selectedTradeIndex]
    const targetTime = tradeTimeToCandle(trade.blockTimestamp, candles) as Time

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
  }, [selectedTradeIndex, trades, candles])

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
  )
}
