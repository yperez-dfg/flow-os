'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const date = new Date(selectedDate + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Expand recurring events for the visible month range
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const expanded = expandEvents(events, firstOfMonth, lastOfMonth)
  const eventDates = new Set(expanded.map((e) => e.date))

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-mono text-[#6E6E73] py-1">
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
                ${isSelected
                  ? 'bg-[#1560FF] text-white'
                  : isToday
                  ? 'bg-[#1560FF]/20 text-[#1560FF]'
                  : 'text-[#1D1D1F] active:bg-[#E5E5EA]'
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
