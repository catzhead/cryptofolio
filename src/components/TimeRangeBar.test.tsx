import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeRangeBar } from './TimeRangeBar'

describe('TimeRangeBar', () => {
  it('renders all time range options', () => {
    render(<TimeRangeBar selected="30" onSelect={vi.fn()} />)
    expect(screen.getByText('1D')).toBeInTheDocument()
    expect(screen.getByText('1W')).toBeInTheDocument()
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('ALL')).toBeInTheDocument()
  })

  it('highlights the selected range', () => {
    render(<TimeRangeBar selected="30" onSelect={vi.fn()} />)
    const button = screen.getByText('1M')
    expect(button.className).toContain('bg-rose-600')
  })

  it('calls onSelect with the days value', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<TimeRangeBar selected="30" onSelect={onSelect} />)

    await user.click(screen.getByText('1W'))
    expect(onSelect).toHaveBeenCalledWith('7')
  })
})
