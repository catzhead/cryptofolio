import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTradeSelection } from './useTradeSelection'

describe('useTradeSelection', () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    expect(result.current.selectedIndex).toBeNull()
  })

  it('selects a trade by index', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(2))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('deselects when clicking the same trade again', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(2))
    expect(result.current.selectedIndex).toBe(2)
    act(() => result.current.select(2))
    expect(result.current.selectedIndex).toBeNull()
  })

  it('selectPrevious moves to previous trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(3))
    act(() => result.current.selectPrevious())
    expect(result.current.selectedIndex).toBe(2)
  })

  it('selectPrevious does not go below 0', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(0))
    act(() => result.current.selectPrevious())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('selectNext moves to next trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(2))
    act(() => result.current.selectNext())
    expect(result.current.selectedIndex).toBe(3)
  })

  it('selectNext does not exceed trade count', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(4))
    act(() => result.current.selectNext())
    expect(result.current.selectedIndex).toBe(4)
  })

  it('selectLast jumps to the last trade', () => {
    const { result } = renderHook(() => useTradeSelection(5))
    act(() => result.current.select(0))
    act(() => result.current.selectLast())
    expect(result.current.selectedIndex).toBe(4)
  })

  it('resets selection when trade count changes', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useTradeSelection(count),
      { initialProps: { count: 5 } },
    )
    act(() => result.current.select(3))
    rerender({ count: 3 })
    expect(result.current.selectedIndex).toBeNull()
  })
})
