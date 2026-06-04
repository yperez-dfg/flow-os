'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import RingProgress from '@/components/ui/RingProgress'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

export default function CalorieRing() {
  const { calorieGoal, mealLog, addMeal, deleteMeal, caloriesConsumed } =
    useFitnessStore()
  const consumed = caloriesConsumed()
  const pct = calorieGoal > 0 ? (consumed / calorieGoal) * 100 : 0
  const remaining = calorieGoal - consumed

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cals, setCals] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !cals) return
    addMeal({
      name: name.trim(),
      calories: Number(cals),
      protein: 0,
      carbs: 0,
      fat: 0,
      time: new Date().toTimeString().slice(0, 5),
    })
    setName('')
    setCals('')
    setOpen(false)
  }

  return (
    <div className="apple-card p-4">
      <div className="flex items-center gap-6 mb-4">
        <RingProgress
          value={pct}
          color={pct > 100 ? '#ff4d6a' : '#00d084'}
          size={100}
          strokeWidth={8}
          label={`${remaining}\nleft`}
        />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Calories
          </p>
          <p className="font-display text-3xl font-bold text-[#1D1D1F]">{consumed}</p>
          <p className="text-xs text-[#6E6E73]">of {calorieGoal} goal</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 flex items-center gap-1 text-[#1560FF] text-xs font-semibold active:scale-95 transition-transform"
          >
            <Plus size={14} /> Log meal
          </button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {mealLog.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-[#1D1D1F] truncate">{m.name}</span>
            <span className="font-mono text-xs text-[#6E6E73] whitespace-nowrap">
              {m.calories} kcal
            </span>
            <button
              onClick={() => deleteMeal(m.id)}
              className="text-[#6E6E73] active:text-[#ff4d6a] transition-colors flex-shrink-0"
              aria-label="Delete meal"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {mealLog.length === 0 && (
          <p className="text-[#6E6E73] text-xs text-center py-2">
            No meals logged today
          </p>
        )}
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Log Meal">
        <div className="space-y-4">
          <input
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50"
            placeholder="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50 font-mono"
            placeholder="Calories"
            value={cals}
            onChange={(e) => setCals(e.target.value)}
          />
          <button
            onClick={handleAdd}
            className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Log
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
