'use client'
import { useFitnessStore, type Exercise } from '@/store/fitness'
import { Trash2 } from 'lucide-react'

interface GymChecklistProps {
  day: string
  exercises: Exercise[]
  editing?: boolean
  onRemove?: (name: string) => void
}

export default function GymChecklist({ day, exercises, editing, onRemove }: GymChecklistProps) {
  const { toggleExercise } = useFitnessStore()

  return (
    <div className="space-y-2">
      {exercises.map((ex) => (
        <div
          key={ex.name}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
            ${ex.done ? 'bg-[#00d084]/10 border-[#00d084]/20' : 'bg-[#F9F9F9] border-[#E5E5EA]'}`}
        >
          <button
            onClick={() => !editing && toggleExercise(day, ex.name)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
              ${ex.done ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
          >
            {ex.done && <span className="text-white text-[10px] font-bold">✓</span>}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${ex.done ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'}`}>
              {ex.name}
            </p>
            <p className="font-mono text-[10px] text-[#6E6E73]">
              {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @ ${ex.weight}lbs` : ''}
            </p>
          </div>
          {editing && onRemove && (
            <button
              onClick={() => onRemove(ex.name)}
              className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
