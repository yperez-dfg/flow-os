'use client'
import { useState, useEffect } from 'react'
import WeightChart from '@/components/fitness/WeightChart'
import WorkoutSchedule from '@/components/fitness/WorkoutSchedule'
import CalorieRing from '@/components/fitness/CalorieRing'
import FoodSearch from '@/components/fitness/FoodSearch'
import { useFitnessStore } from '@/store/fitness'
import { useCalendarStore } from '@/store/calendar'
import { buildWorkoutEvents } from '@/lib/workout-calendar-sync'
import { CalendarDays, Check } from 'lucide-react'

export default function FitnessPage() {
  const { workoutSchedule, hydrateMeals } = useFitnessStore()
  const { addEvent } = useCalendarStore()
  const [synced, setSynced] = useState(false)

  useEffect(() => { hydrateMeals() }, [hydrateMeals])

  const syncToCalendar = () => {
    const events = buildWorkoutEvents(workoutSchedule)
    events.forEach(e => addEvent(e))
    setSynced(true)
    setTimeout(() => setSynced(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Fitness</h1>
        <button
          type="button"
          onClick={syncToCalendar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E5EA]
                     text-xs font-medium text-[#1D1D1F] shadow-sm active:scale-95 transition-all"
        >
          {synced
            ? <><Check size={12} className="text-[#00d084]" /> Synced!</>
            : <><CalendarDays size={12} /> Sync to Calendar</>
          }
        </button>
      </div>
      <WeightChart />
      <CalorieRing />
      <FoodSearch />
      <WorkoutSchedule />
    </div>
  )
}
