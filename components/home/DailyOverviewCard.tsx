'use client'
import { usePlannerStore } from '@/store/planner'
import { useBudgetStore } from '@/store/budget'
import { useFitnessStore } from '@/store/fitness'
import GlassCard from '@/components/ui/GlassCard'

export default function DailyOverviewCard() {
  const personalTasks = usePlannerStore((s) => s.personalTasks)
  const spentByCategory = useBudgetStore((s) => s.spentByCategory)
  const monthlyIncome = useBudgetStore((s) => s.monthlyIncome)
  const calorieGoal = useFitnessStore((s) => s.calorieGoal)
  const caloriesConsumed = useFitnessStore((s) => s.caloriesConsumed)

  const tasksDue = personalTasks.filter((t) => !t.done).length
  const totalSpent = Object.values(spentByCategory()).reduce((a, b) => a + b, 0)
  const budgetLeft = monthlyIncome - totalSpent
  const calsLeft = calorieGoal - caloriesConsumed()

  return (
    <GlassCard glow="#1560FF" className="p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
        Today at a Glance
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Tasks Remaining</p>
          <p className="font-display text-xl font-bold text-[#edeef2]">{tasksDue}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Calories Left</p>
          <p
            className="font-display text-xl font-bold"
            style={{ color: calsLeft < 200 ? '#ff4d6a' : '#00d084' }}
          >
            {calsLeft}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Budget Left</p>
          <p
            className="font-display text-xl font-bold"
            style={{ color: budgetLeft < 0 ? '#ff4d6a' : '#edeef2' }}
          >
            ${budgetLeft.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Date</p>
          <p className="font-mono text-sm text-[#edeef2]">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
