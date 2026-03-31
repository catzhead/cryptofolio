import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioHeader } from './PortfolioHeader'

describe('PortfolioHeader', () => {
  it('renders total value and 24h change', () => {
    render(<PortfolioHeader totalValue={24532.5} change24h={2.4} />)
    expect(screen.getByText('$24,532.50')).toBeInTheDocument()
    expect(screen.getByText('+2.40%')).toBeInTheDocument()
  })

  it('shows negative change in red', () => {
    render(<PortfolioHeader totalValue={10000} change24h={-1.5} />)
    const change = screen.getByText('-1.50%')
    expect(change.className).toContain('text-red')
  })

  it('renders zero state', () => {
    render(<PortfolioHeader totalValue={0} change24h={0} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})
