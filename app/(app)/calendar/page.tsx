'use client'
import { useState } from 'react'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add event"
        >
          <Plus size={22} />
        </button>
      </div>
      <CalendarHeader />
      <MonthView />
      <DayView />
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
