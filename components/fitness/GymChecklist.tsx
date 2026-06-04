'use client'
import { useFitnessStore, type Exercise } from '@/store/fitness'

interface GymChecklistProps {
  day: string
  exercises: Exercise[]
}

export default function GymChecklist({ day, exercises }: GymChecklistProps) {
  const { toggleExercise } = useFitnessStore()

  return (
    <div className="space-y-2">
      {exercises.map((ex) => (
        <button
          key={ex.name}
          onClick={() => toggleExercise(day, ex.name)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left
            ${
              ex.done
                ? 'bg-[#00d084]/10 border-[#00d084]/20'
                : 'bg-white/[0.02] border-white/[0.06]'
            }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
              ${ex.done ? 'bg-[#00d084] border-[#00d084]' : 'border-white/20'}`}
          >
            {ex.done && (
              <span className="text-white text-[10px] font-bold">✓</span>
            )}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                ex.done ? 'line-through text-[#8a8f9a]' : 'text-[#edeef2]'
              }`}
            >
              {ex.name}
            </p>
            <p className="font-mono text-[10px] text-[#8a8f9a]">
              {ex.sets}×{ex.reps}
              {ex.weight > 0 ? ` @ ${ex.weight}lbs` : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
