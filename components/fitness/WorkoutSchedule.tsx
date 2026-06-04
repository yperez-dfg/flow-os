'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import GymChecklist from './GymChecklist'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function WorkoutSchedule() {
  const { workoutSchedule } = useFitnessStore()
  // Start on today's day
  const todayIdx = (new Date().getDay() + 6) % 7 // 0=Mon
  const [selected, setSelected] = useState<typeof DAYS[number]>(DAYS[todayIdx])

  const selectedDay = workoutSchedule.find((d) => d.day === selected)

  return (
    <div className="glass p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
        Workout Schedule
      </p>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {workoutSchedule.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelected(d.day)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors
              ${
                selected === d.day
                  ? 'bg-[#1560FF] text-white'
                  : 'bg-white/[0.04] text-[#8a8f9a]'
              }`}
          >
            <span className="text-xs font-semibold">{d.day}</span>
            <span className="text-[9px] mt-0.5 opacity-80">
              {d.type.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      {selectedDay && (
        <div>
          <p className="text-sm font-semibold text-[#edeef2] mb-3">
            {selectedDay.type}
          </p>
          {selectedDay.exercises.length > 0 ? (
            <GymChecklist day={selectedDay.day} exercises={selectedDay.exercises} />
          ) : (
            <p className="text-[#8a8f9a] text-sm text-center py-4">
              Rest day — recover and recharge 💪
            </p>
          )}
        </div>
      )}
    </div>
  )
}
