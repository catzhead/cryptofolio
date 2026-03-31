import { useRef, useEffect } from 'react'
import type { Trade } from '../types'

interface TradeTableProps {
  trades: Trade[]
  tokenSymbol: string
  currentValue?: number
  selectedIndex: number | null
  onRowClick: (index: number) => void
}

function formatCurrency(value: number, prefix: string = '$'): string {
  return `${prefix}${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toISOString().split('T')[0]
  const time = d.toISOString().split('T')[1].slice(0, 5)
  return `${date} ${time}`
}

function formatAmount(value: number): string {
  // Remove trailing zeros after decimal point
  return parseFloat(value.toFixed(4)).toString()
}

export function TradeTable({ trades, tokenSymbol, currentValue, selectedIndex, onRowClick }: TradeTableProps) {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  useEffect(() => {
    if (selectedIndex !== null && rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]!.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedIndex])

  let runningAmount = 0
  let runningUsd = 0
  let runningSgdThen = 0
  let runningSgdNow = 0
  let runningFxImpact = 0

  const rows = trades.map((trade, index) => {
    const sign = trade.type === 'buy' ? 1 : -1
    runningAmount += trade.valueFormatted * sign
    runningUsd += (trade.usdValue ?? 0) * sign
    runningSgdThen += (trade.sgdThen ?? 0) * sign
    runningSgdNow += (trade.sgdNow ?? 0) * sign
    runningFxImpact += trade.fxImpact ?? 0

    const isSelected = selectedIndex === index
    const highlight = isSelected ? 'bg-slate-700/60 ring-1 ring-rose-500/50' : ''

    return (
      <tr
        key={trade.transactionHash}
        ref={(el) => { rowRefs.current[index] = el }}
        onClick={() => onRowClick(index)}
        role="row"
        className={`cursor-pointer hover:bg-slate-800/50 transition-colors ${highlight}`}
      >
        <td className="px-3 py-2 text-slate-300 text-sm">
          {formatTimestamp(trade.blockTimestamp)}
        </td>
        <td className={`px-3 py-2 font-bold text-sm ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
          {trade.type === 'buy' ? 'Buy' : 'Sell'}
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{trade.valueFormatted} {tokenSymbol}</div>
          <div className="text-slate-500 text-xs">Total: {formatAmount(runningAmount)}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.usdValue ?? 0)}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningUsd)}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.sgdThen ?? 0, 'S$')}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningSgdThen, 'S$')}</div>
        </td>
        <td className="px-3 py-2">
          <div className="text-slate-200 text-sm">{formatCurrency(trade.sgdNow ?? 0, 'S$')}</div>
          <div className="text-slate-500 text-xs">Total: {formatCurrency(runningSgdNow, 'S$')}</div>
        </td>
        <td className="px-3 py-2">
          <div className={`text-sm ${(trade.fxImpact ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(trade.fxImpact ?? 0) >= 0 ? '+' : '-'}{formatCurrency(trade.fxImpact ?? 0, 'S$')}
          </div>
          <div className="text-slate-500 text-xs">
            Total: {runningFxImpact >= 0 ? '+' : '-'}{formatCurrency(runningFxImpact, 'S$')}
          </div>
        </td>
      </tr>
    )
  })

  const totalAmount = trades.reduce((acc, t) => acc + t.valueFormatted * (t.type === 'buy' ? 1 : -1), 0)
  const totalFxImpact = trades.reduce((acc, t) => acc + (t.fxImpact ?? 0), 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-900/80 text-slate-400 text-xs">
            <th className="px-3 py-2 text-left font-medium">Date & Time</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Amount</th>
            <th className="px-3 py-2 text-left font-medium">USD Value</th>
            <th className="px-3 py-2 text-left font-medium">SGD (then)</th>
            <th className="px-3 py-2 text-left font-medium">SGD (now)</th>
            <th className="px-3 py-2 text-left font-medium">FX Impact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-3 px-3 py-2 bg-slate-900/50 rounded-lg text-sm">
        <div>
          <span className="text-slate-400">Holdings: </span>
          <span className="text-white font-medium">{formatAmount(totalAmount)} {tokenSymbol}</span>
        </div>
        {currentValue !== undefined && (
          <div>
            <span className="text-slate-400">Current value: </span>
            <span className="text-white font-medium">{formatCurrency(currentValue)}</span>
          </div>
        )}
        <div>
          <span className="text-slate-400">Total FX impact: </span>
          <span className={totalFxImpact >= 0 ? 'text-green-400' : 'text-red-400'}>
            {totalFxImpact >= 0 ? '+' : '-'}{formatCurrency(totalFxImpact, 'S$')}
          </span>
        </div>
      </div>
    </div>
  )
}
