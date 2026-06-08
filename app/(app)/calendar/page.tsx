'use client'
import { useState, useEffect } from 'react'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { useCalendarStore } from '@/store/calendar'
import { usePlannerStore } from '@/store/planner'
import { generateMultiDayICS, downloadICS } from '@/lib/ics-utils'
import { Plus, CalendarDays } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { view, events } = useCalendarStore()
  const { hydrate: hydratePlanner } = usePlannerStore()

  // Hydrate planner so MonthView can read task completion for day coloring
  useEffect(() => {
    hydratePlanner()
  }, [hydratePlanner])

  function exportAllToIOS() {
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - 30)
    const to = new Date(today)
    to.setDate(to.getDate() + 90)
    const fromISO = from.toISOString().split('T')[0]
    const toISO = to.toISOString().split('T')[0]

    // Only include events that have a time (timed events can be imported into Apple Calendar)
    const blocks = events
      .filter((e) => e.time && e.date >= fromISO && e.date <= toISO)
      .map((e) => {
        const [sh, sm] = e.time!.split(':').map(Number)
        const durationMins = e.endTime
          ? (() => {
              const [eh, em] = e.endTime.split(':').map(Number)
              return Math.max(15, eh * 60 + em - (sh * 60 + sm))
            })()
          : 60
        return {
          date: e.date,
          time: e.time!,
          title: e.title,
          duration: durationMins,
          notes: e.notes,
          type: 'task' as const,
        }
      })

    if (blocks.length === 0) {
      alert('No timed events to export. Add events with a start time first.')
      return
    }

    const todayISO = today.toISOString().split('T')[0]
    const ics = generateMultiDayICS(blocks)
    downloadICS(ics, `flowos-calendar-${todayISO}.ics`)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAllToIOS}
            className="flex items-center gap-1 text-[#1560FF] text-xs font-semibold px-3 py-2 rounded-full bg-[#1560FF]/10 active:scale-90 transition-transform"
            aria-label="Export to iOS Calendar"
          >
            <CalendarDays size={14} />
            <span>iOS</span>
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="text-[#1560FF] active:scale-90 transition-transform"
            aria-label="Add event"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>
      <CalendarHeader />
      {view === 'week' && <WeekView />}
      {view === 'month' && (
        <>
          <MonthView />
          <DayView />
        </>
      )}
      {view === 'day' && <DayView />}
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
