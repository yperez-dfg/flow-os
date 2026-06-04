'use client'
import { useCalendarStore } from '@/store/calendar'
import Badge from '@/components/ui/Badge'

export default function DayView() {
  const { selectedDate, events } = useCalendarStore()
  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div className="space-y-2 mt-4">
      {dayEvents.length === 0 && (
        <p className="text-[#8a8f9a] text-sm text-center py-8">
          No events on this day
        </p>
      )}
      {dayEvents.map((e) => (
        <div
          key={e.id}
          className="glass p-3 flex items-start gap-3"
          style={{ borderLeft: `3px solid ${e.color}` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-medium text-[#edeef2]">{e.title}</p>
              {e.type === 'crm_meeting' && <Badge label="DFG" color="blue" />}
            </div>
            {e.notes && (
              <p className="text-[11px] text-[#8a8f9a]">{e.notes}</p>
            )}
          </div>
          {e.time && (
            <p className="font-mono text-xs text-[#8a8f9a] whitespace-nowrap flex-shrink-0">
              {e.time}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
