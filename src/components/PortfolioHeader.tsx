interface PortfolioHeaderProps {
  totalValue: number
  change24h: number
}

export function PortfolioHeader({ totalValue, change24h }: PortfolioHeaderProps) {
  const safeTotal = totalValue ?? 0
  const safeChange = change24h ?? 0
  const changeColor = safeChange >= 0 ? 'text-emerald-400' : 'text-red-400'
  const changePrefix = safeChange >= 0 ? '+' : ''

  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-sm text-stone-400">Total Portfolio</div>
        <div className="text-2xl font-bold text-white">
          ${safeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div>
        <div className="text-sm text-stone-400">24h Change</div>
        <div className={`text-lg font-semibold ${changeColor}`}>
          {changePrefix}{safeChange.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}
