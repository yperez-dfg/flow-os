'use client'
import { useCalendarStore } from '@/store/calendar'
import { usePlannerStore } from '@/store/planner'
import { expandEvents } from '@/lib/calendar-utils'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const { personalTasks } = usePlannerStore()

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

  // Build per-date task completion stats for past-day coloring
  const tasksByDate: Record<string, { total: number; done: number }> = {}
  personalTasks.forEach((t) => {
    if (!t.due) return
    if (!tasksByDate[t.due]) tasksByDate[t.due] = { total: 0, done: 0 }
    tasksByDate[t.due].total++
    if (t.done) tasksByDate[t.due].done++
  })

  function pastDayColorClass(iso: string): string | null {
    if (iso >= today) return null
    const stats = tasksByDate[iso]
    if (!stats || stats.total === 0) return null
    const ratio = stats.done / stats.total
    if (ratio >= 1) return 'bg-[#00d084]/20 text-[#00d084]'    // all done — green
    if (ratio >= 0.5) return 'bg-[#FF9F0A]/20 text-[#FF9F0A]'  // half+ done — yellow
    return 'bg-[#ff4d6a]/20 text-[#ff4d6a]'                    // none / few done — red
  }

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
          const colorClass = (!isSelected && !isToday) ? pastDayColorClass(iso) : null

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-[#1560FF] text-white'
                  : isToday
                  ? 'bg-[#1560FF]/20 text-[#1560FF]'
                  : colorClass
                  ? colorClass
                  : 'text-[#1D1D1F] active:bg-[#E5E5EA]'
                }`}
            >
              {day}
              {hasEvent && (
                <div
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white' : 'bg-[#00d4ff]'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
