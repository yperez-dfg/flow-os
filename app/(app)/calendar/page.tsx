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
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Calendar</h1>
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
