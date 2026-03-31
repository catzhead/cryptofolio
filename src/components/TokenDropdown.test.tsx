import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TokenDropdown } from './TokenDropdown'
import type { TokenBalance } from '../types'

const tokens: TokenBalance[] = [
  {
    tokenAddress: '0xabc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    balance: '160000000',
    balanceFormatted: '1.6',
    usdPrice: 67000,
    usdValue: 107200,
    usdPrice24hrPercentChange: 3.2,
    chain: 'ethereum',
  },
  {
    tokenAddress: '0xdef',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '4200000000000000000',
    balanceFormatted: '4.2',
    usdPrice: 1952,
    usdValue: 8198,
    usdPrice24hrPercentChange: -1.1,
    chain: 'arbitrum',
  },
]

describe('TokenDropdown', () => {
  it('shows selected token info when closed', () => {
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByText('WBTC')).toBeInTheDocument()
    expect(screen.getByText('(Ethereum)')).toBeInTheDocument()
    expect(screen.getByText('1.6')).toBeInTheDocument()
  })

  it('opens dropdown and shows all tokens on click', async () => {
    const user = userEvent.setup()
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={vi.fn()} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('(Arbitrum)')).toBeInTheDocument()
  })

  it('calls onSelect when a token is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TokenDropdown tokens={tokens} selectedIndex={0} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('ETH'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
