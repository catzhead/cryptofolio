import { useState, useCallback, useEffect } from 'react'

export function useTradeSelection(tradeCount: number) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    setSelectedIndex(null)
  }, [tradeCount])

  const select = useCallback((index: number) => {
    setSelectedIndex((prev) => prev === index ? null : index)
  }, [])

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null || prev <= 0) return prev ?? 0
      return prev - 1
    })
  }, [])

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0
      if (prev >= tradeCount - 1) return prev
      return prev + 1
    })
  }, [tradeCount])

  const selectLast = useCallback(() => {
    if (tradeCount > 0) {
      setSelectedIndex(tradeCount - 1)
    }
  }, [tradeCount])

  return { selectedIndex, select, selectPrevious, selectNext, selectLast }
}
