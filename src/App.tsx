import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from './components/ConnectButton'
import { PortfolioHeader } from './components/PortfolioHeader'
import { TokenDropdown } from './components/TokenDropdown'
import { TimeRangeBar } from './components/TimeRangeBar'
import { PriceChart } from './components/PriceChart'
import { TradeTable } from './components/TradeTable'
import { useTokenBalances } from './hooks/useTokenBalances'
import { useOHLC } from './hooks/useOHLC'
import { useTradeHistory } from './hooks/useTradeHistory'
import { useTradeSelection } from './hooks/useTradeSelection'
import type { TimeRange } from './types'

export default function App() {
  const { address, isConnected } = useAccount()
  const { data: tokens } = useTokenBalances(address)
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0)
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  const selectedToken = tokens?.[selectedTokenIndex]

  const { data: candles } = useOHLC(
    selectedToken?.tokenAddress,
    selectedToken?.chain,
    timeRange,
  )

  const { data: trades } = useTradeHistory(
    address,
    selectedToken?.chain,
    selectedToken?.tokenAddress,
  )

  const { selectedIndex, select, selectPrevious, selectNext, selectLast } =
    useTradeSelection(trades?.length ?? 0)

  useEffect(() => {
    setSelectedTokenIndex(0)
  }, [address])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!trades?.length) return
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          selectPrevious()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          selectNext()
          break
        case 'End':
          e.preventDefault()
          selectLast()
          break
      }
    },
    [trades, selectPrevious, selectNext, selectLast],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const totalValue = tokens?.reduce((sum, t) => sum + t.usdValue, 0) ?? 0
  const weightedChange = tokens?.length
    ? tokens.reduce((sum, t) => sum + t.usdPrice24hrPercentChange * (t.usdValue / totalValue), 0)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-rose-500">CryptoFolio</h1>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-slate-400 text-lg">Connect your wallet to get started</p>
          </div>
        ) : (
          <>
            {/* Portfolio summary */}
            <div className="mb-6">
              <PortfolioHeader totalValue={totalValue} change24h={weightedChange} />
            </div>

            {/* Token selector */}
            {tokens && tokens.length > 0 ? (
              <>
                <div className="mb-4">
                  <TokenDropdown
                    tokens={tokens}
                    selectedIndex={selectedTokenIndex}
                    onSelect={setSelectedTokenIndex}
                  />
                </div>

                {/* Time range */}
                <div className="mb-4">
                  <TimeRangeBar selected={timeRange} onSelect={setTimeRange} />
                </div>

                {/* Price chart */}
                {candles && (
                  <div className="mb-6">
                    <PriceChart
                      candles={candles}
                      trades={trades ?? []}
                      selectedTradeIndex={selectedIndex}
                      onTradeClick={select}
                    />
                  </div>
                )}

                {/* Trade table */}
                {trades && selectedToken && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-white mb-3">Trade History</h2>
                    <TradeTable
                      trades={trades}
                      tokenSymbol={selectedToken.symbol}
                      currentValue={selectedToken.usdValue}
                      selectedIndex={selectedIndex}
                      onRowClick={select}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">No tokens found for this wallet</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
