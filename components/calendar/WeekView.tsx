'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'

const HOUR_START = 6    // 6am
const HOUR_END = 23     // 11pm
const TOTAL_HOURS = HOUR_END - HOUR_START
const SLOT_HEIGHT = 48  // px per hour

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getMondayOf(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ap}`
}

export default function WeekView() {
  const { selectedDate, events } = useCalendarStore()
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMondayOf(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = weekDays[6]

  const expanded = expandEvents(events, weekStart, weekEnd)

  return (
    <div className="overflow-x-hidden">
      {/* Day headers */}
      <div className="flex pl-8 mb-1">
        {weekDays.map((day) => {
          const d = new Date(day + 'T00:00:00')
          const isToday = day === today
          return (
            <div key={day} className="flex-1 flex flex-col items-center">
              <span className="text-[9px] font-mono text-[#AEAEB2] uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xs font-semibold mt-0.5
                ${isToday ? 'text-[#1560FF]' : 'text-[#1D1D1F]'}`}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '60dvh' }}>
        <div className="flex" style={{ height: SLOT_HEIGHT * TOTAL_HOURS }}>
          {/* Hour labels column */}
          <div className="w-8 flex-shrink-0 relative">
            {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
              const h = HOUR_START + i
              const label = h % 12 === 0 ? '12' : String(h % 12)
              const ap = h >= 12 ? 'p' : 'a'
              return (
                <div
                  key={i}
                  className="absolute right-1 text-[9px] font-mono text-[#AEAEB2] -translate-y-1/2"
                  style={{ top: i * SLOT_HEIGHT }}
                >
                  {label}{ap}
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const isToday = day === today
            const dayEvents = expanded.filter(e => e.date === day && e.time)

            return (
              <div
                key={day}
                className={`flex-1 relative border-l border-[#F2F2F7]
                  ${isToday ? 'bg-[#1560FF]/[0.025]' : ''}`}
              >
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-[#F2F2F7]"
                    style={{ top: i * SLOT_HEIGHT }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((ev) => {
                  const startMins = timeToMinutes(ev.time!)
                  const endMins = ev.endTime ? timeToMinutes(ev.endTime) : startMins + 60
                  const topPx = ((startMins - HOUR_START * 60) / 60) * SLOT_HEIGHT
                  const heightPx = Math.max(28, ((endMins - startMins) / 60) * SLOT_HEIGHT)

                  return (
                    <div
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden"
                      style={{
                        top: topPx,
                        height: heightPx,
                        backgroundColor: ev.color + 'e6',
                      }}
                    >
                      <p className="text-white text-[9px] font-semibold leading-tight truncate">
                        {ev.title}
                      </p>
                      <p className="text-white/80 text-[8px] font-mono">
                        {fmt12(ev.time!)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
