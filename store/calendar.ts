import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface CalendarEvent {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:MM
  endTime?: string
  notes?: string
  color: string      // hex
  repeat: 'none' | 'daily' | 'weekly' | 'monthly'
  notify: boolean
  notifyMinutesBefore: number
  type: 'personal' | 'crm_meeting' | 'alarm'
  sourceId?: string  // lead id for crm_meeting
}

interface CalendarState {
  events: CalendarEvent[]
  view: 'month' | 'week' | 'day'
  selectedDate: string
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  setView: (v: CalendarState['view']) => void
  setSelectedDate: (d: string) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      view: 'month',
      selectedDate: new Date().toISOString().split('T')[0],
      addEvent: (e) =>
        set((s) => ({ events: [...s.events, { ...e, id: nanoid() }] })),
      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      setView: (view) => set({ view }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
    }),
    { name: 'flowos-calendar' }
  )
)
