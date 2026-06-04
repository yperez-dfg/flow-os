'use client'
import { usePlannerStore } from '@/store/planner'

export default function WeeklyGoals() {
  const { weeklyGoals } = usePlannerStore()

  if (weeklyGoals.length === 0) {
    return (
      <div className="glass p-4 text-center">
        <p className="text-[#8a8f9a] text-sm">No weekly goals set</p>
        <p className="text-[10px] text-[#8a8f9a] mt-1">Add goals in Settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {weeklyGoals.map((g) => {
        const pct = Math.min((g.current / g.target) * 100, 100)
        const done = g.current >= g.target
        return (
          <div key={g.id} className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#edeef2]">{g.title}</p>
              <span
                className={`font-mono text-xs ${done ? 'text-[#00d084]' : 'text-[#8a8f9a]'}`}
              >
                {g.current}/{g.target} {g.unit}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: done ? '#00d084' : '#1560FF',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
