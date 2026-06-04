'use client'
import { useCalendarStore } from '@/store/calendar'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const date = new Date(selectedDate + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const eventDates = new Set(events.map((e) => e.date))

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-mono text-[#8a8f9a] py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = iso === today
          const isSelected = iso === selectedDate
          const hasEvent = eventDates.has(iso)
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${
                  isSelected
                    ? 'bg-[#1560FF] text-white'
                    : isToday
                    ? 'bg-[#1560FF]/20 text-[#1560FF]'
                    : 'text-[#edeef2] active:bg-white/[0.06]'
                }`}
            >
              {day}
              {hasEvent && (
                <div className="w-1 h-1 rounded-full bg-[#00d4ff] mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
