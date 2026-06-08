'use client'
import { useState, useEffect } from 'react'
import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import Routines from '@/components/planner/Routines'
import WeeklyGoals from '@/components/planner/WeeklyGoals'
import LongTermGoals from '@/components/planner/LongTermGoals'
import SchedulePlanner from '@/components/planner/SchedulePlanner'
import { usePlannerStore } from '@/store/planner'

type PlannerView = 'today' | 'all'

export default function PlannerPage() {
  const [planView, setPlanView] = useState<PlannerView>('today')
  const { resetDailyTasksIfNeeded, hydrate } = usePlannerStore()

  useEffect(() => {
    hydrate().then(() => resetDailyTasksIfNeeded())
  }, [hydrate, resetDailyTasksIfNeeded])

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Planner</h1>
        <SchedulePlanner />
      </div>

      {/* Today / All toggle */}
      <div className="flex bg-[#E5E5EA] rounded-2xl p-1">
        {(['today', 'all'] as PlannerView[]).map((v) => (
          <button
            key={v}
            onClick={() => setPlanView(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${planView === v
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73]'
              }`}
          >
            {v === 'today' ? 'Today' : 'All'}
          </button>
        ))}
      </div>

      <CRMTaskList todayOnly={planView === 'today'} />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <PersonalTaskList todayOnly={planView === 'today'} />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <Routines />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <WeeklyGoals />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <LongTermGoals />
    </div>
  )
}
