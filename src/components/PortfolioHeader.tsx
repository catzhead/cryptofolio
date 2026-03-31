interface PortfolioHeaderProps {
  totalValue: number
  change24h: number
}

export function PortfolioHeader({ totalValue, change24h }: PortfolioHeaderProps) {
  const changeColor = change24h >= 0 ? 'text-green-400' : 'text-red-400'
  const changePrefix = change24h >= 0 ? '+' : ''

  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-sm text-slate-400">Total Portfolio</div>
        <div className="text-2xl font-bold text-white">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div>
        <div className="text-sm text-slate-400">24h Change</div>
        <div className={`text-lg font-semibold ${changeColor}`}>
          {changePrefix}{change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}
