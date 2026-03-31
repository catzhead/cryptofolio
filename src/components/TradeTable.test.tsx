import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TradeTable } from './TradeTable'
import type { Trade } from '../types'

const trades: Trade[] = [
  {
    transactionHash: '0xtx1',
    blockTimestamp: '2025-06-03T14:32:18.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '30000000',
    valueFormatted: 0.3,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 19740,
    sgdThen: 26449,
    sgdNow: 26076,
    fxImpact: -373,
  },
  {
    transactionHash: '0xtx2',
    blockTimestamp: '2025-09-18T09:15:42.000Z',
    fromAddress: '0xother',
    toAddress: '0x1234',
    value: '100000000',
    valueFormatted: 1.0,
    tokenSymbol: 'WBTC',
    tokenDecimals: 8,
    type: 'buy',
    usdValue: 58200,
    sgdThen: 76824,
    sgdNow: 76914,
    fxImpact: 90,
  },
]

describe('TradeTable', () => {
  it('renders trade rows with correct data', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getAllByText('Buy')[0]).toBeInTheDocument()
    expect(screen.getByText('0.3 WBTC')).toBeInTheDocument()
  })

  it('shows running totals in dimmed text', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Total: 0.3')).toBeInTheDocument()
    expect(screen.getByText('Total: 1.3')).toBeInTheDocument()
  })

  it('calls onRowClick when a row is clicked', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        selectedIndex={null}
        onRowClick={onRowClick}
      />,
    )

    const rows = screen.getAllByRole('row')
    await user.click(rows[1])
    expect(onRowClick).toHaveBeenCalledWith(0)
  })

  it('renders footer with totals', () => {
    render(
      <TradeTable
        trades={trades}
        tokenSymbol="WBTC"
        currentValue={107200}
        selectedIndex={null}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('1.3 WBTC')).toBeInTheDocument()
  })
})
