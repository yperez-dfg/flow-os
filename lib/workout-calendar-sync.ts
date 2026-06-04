import type { WorkoutDay } from '@/store/fitness'
import type { CalendarEvent } from '@/store/calendar'

const DAY_OFFSET: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0
}

const WORKOUT_COLORS: Record<string, string> = {
  'Push Day': '#1560FF',
  'Pull Day': '#a855f7',
  'Legs Day': '#00d084',
  'Cardio':   '#ffb547',
}

function getNextOccurrence(dayOfWeek: number): string {
  const today = new Date()
  const diff = (dayOfWeek - today.getDay() + 7) % 7 || 7
  const next = new Date(today)
  next.setDate(today.getDate() + diff)
  return next.toISOString().split('T')[0]
}

export function buildWorkoutEvents(schedule: WorkoutDay[]): Omit<CalendarEvent, 'id'>[] {
  return schedule
    .filter(d => d.type !== 'Rest Day' && d.exercises.length > 0)
    .map(d => ({
      title: `🏋️ ${d.type}`,
      date: getNextOccurrence(DAY_OFFSET[d.day] ?? 1),
      time: '06:00',
      color: WORKOUT_COLORS[d.type] ?? '#1560FF',
      repeat: 'weekly' as const,
      notify: true,
      notifyMinutesBefore: 30,
      type: 'personal' as const,
      notes: d.exercises.map(e => `${e.name} ${e.sets}×${e.reps}`).join(', '),
    }))
}
