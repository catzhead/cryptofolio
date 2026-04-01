import { TIME_RANGE_OPTIONS, type TimeRange } from '../types'

interface TimeRangeBarProps {
  selected: TimeRange
  onSelect: (range: TimeRange) => void
}

export function TimeRangeBar({ selected, onSelect }: TimeRangeBarProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_RANGE_OPTIONS.map((option) => (
        <button
          key={option.days}
          onClick={() => onSelect(option.days)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            selected === option.days
              ? 'bg-amber-600 text-white'
              : 'bg-stone-800 text-stone-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
