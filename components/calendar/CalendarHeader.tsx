'use client'
import { useCalendarStore } from '@/store/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarHeader() {
  const { view, selectedDate, setView, setSelectedDate } = useCalendarStore()
  const date = new Date(selectedDate + 'T00:00:00')

  const navigate = (dir: -1 | 1) => {
    const d = new Date(date)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    if (view === 'day') d.setDate(d.getDate() + dir)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const label =
    view === 'month'
      ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'week'
      ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-1">
        {(['month', 'week', 'day'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors
              ${view === v ? 'bg-[#1560FF] text-white' : 'text-[#8a8f9a]'}`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="text-[#8a8f9a] active:text-white p-1 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-mono text-xs text-[#edeef2] min-w-[110px] text-center">
          {label}
        </p>
        <button
          onClick={() => navigate(1)}
          className="text-[#8a8f9a] active:text-white p-1 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
