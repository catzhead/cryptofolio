import { useState, useEffect, useCallback, Component, type ReactNode } from 'react'
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
import { useDemo } from './hooks/useDemo'
import { queryClient } from './queryClient'
import { MOCK_TOKENS, getMockCandles, getMockTrades } from './lib/mockData'
import type { TimeRange } from './types'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4">{this.state.error.message}</p>
            <button onClick={() => this.setState({ error: null })} className="bg-rose-600 px-4 py-2 rounded-lg">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Dashboard() {
  const isDemo = useDemo()

  const { address: realAddress, isConnected: realConnected } = useAccount()
  const address = isDemo ? '0xDemo1234567890' : realAddress
  const isConnected = isDemo ? true : realConnected

  // Cancel real queries when entering demo mode
  useEffect(() => {
    if (isDemo) {
      queryClient.cancelQueries()
      queryClient.clear()
    }
  }, [isDemo])

  const { data: realTokens, isLoading: tokensLoading, error: tokensError } = useTokenBalances(isDemo ? undefined : address)
  const tokens = isDemo ? MOCK_TOKENS : realTokens

  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0)
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  const selectedToken = tokens?.[selectedTokenIndex]

  const { data: realCandles } = useOHLC(
    isDemo ? undefined : selectedToken?.tokenAddress,
    isDemo ? undefined : selectedToken?.chain,
    timeRange,
  )
  const demoCandles = isDemo && selectedToken ? getMockCandles(selectedToken.tokenAddress, timeRange) : undefined
  const candles = isDemo ? demoCandles : realCandles

  const { data: realTrades, isLoading: tradesLoading, error: tradesError } = useTradeHistory(
    isDemo ? undefined : address,
    isDemo ? undefined : selectedToken?.chain,
    isDemo ? undefined : selectedToken?.tokenAddress,
  )
  const trades = isDemo && selectedToken ? getMockTrades(selectedToken.tokenAddress) : realTrades

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
          <h1 className="text-xl font-bold text-rose-500">
            CryptoFolio
            {isDemo && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">DEMO</span>}
          </h1>
          {isDemo ? (
            <span className="bg-slate-800 text-green-400 px-4 py-2 rounded-lg font-mono text-sm">
              0xDemo...1234
            </span>
          ) : (
            <ConnectButton />
          )}
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
            {!isDemo && tokensLoading ? (
              <p className="text-slate-400">Loading tokens...</p>
            ) : !isDemo && tokensError ? (
              <p className="text-red-400">Error loading tokens: {tokensError.message}</p>
            ) : tokens && tokens.length > 0 ? (
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
                {!isDemo && tradesLoading && (
                  <p className="text-slate-400">Loading trade history...</p>
                )}
                {!isDemo && tradesError && (
                  <p className="text-red-400">Error loading trades: {tradesError.message}</p>
                )}
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

export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  )
}
