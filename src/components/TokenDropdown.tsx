import { useState, useRef, useEffect } from 'react'
import type { TokenBalance } from '../types'
import { CHAINS } from '../lib/chains'

interface TokenDropdownProps {
  tokens: TokenBalance[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function TokenDropdown({ tokens, selectedIndex, onSelect }: TokenDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = tokens[selectedIndex]
  if (!selected) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">{selected.symbol}</span>
          <span className="text-slate-400 text-sm">({CHAINS[selected.chain].name})</span>
          <span className="text-slate-300 text-sm">{selected.balanceFormatted}</span>
          <span className="text-slate-400 text-sm">
            ${(selected.usdValue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
          {tokens.map((token, index) => (
            <button
              key={`${token.tokenAddress}-${token.chain}`}
              onClick={() => {
                onSelect(index)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                index === selectedIndex ? 'bg-slate-700/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold ${index === selectedIndex ? 'text-rose-500' : 'text-white'}`}>
                  {token.symbol}
                </span>
                <span className="text-slate-400 text-sm">({CHAINS[token.chain].name})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm">{token.balanceFormatted}</span>
                <span className="text-slate-400 text-sm">
                  ${(token.usdValue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
