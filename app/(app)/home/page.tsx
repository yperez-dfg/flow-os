'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AIChatInput from '@/components/home/AIChatInput'
import QuickActionChips from '@/components/home/QuickActionChips'
import CRMStatsGrid from '@/components/home/CRMStatsGrid'
import StreakTracker from '@/components/home/StreakTracker'
import { useSettingsStore } from '@/store/settings'
import { usePlannerStore } from '@/store/planner'
import { useFitnessStore } from '@/store/fitness'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}.`
  if (h < 17) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
}

export default function HomePage() {
  const { userName } = useSettingsStore()
  const { personalTasks } = usePlannerStore()
  const { workoutSchedule } = useFitnessStore()
  const [chipHint, setChipHint] = useState('')

  const tasksDue = personalTasks.filter(t => !t.done).length
  const todayDay = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)[new Date().getDay()]
  const todayWorkout = workoutSchedule.find(d => d.day === todayDay)

  const contextLine = [
    tasksDue > 0 && `${tasksDue} task${tasksDue > 1 ? 's' : ''} due`,
    todayWorkout && todayWorkout.type !== 'Rest Day' && todayWorkout.type,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display italic text-3xl text-[#1D1D1F] leading-tight"
        >
          {getGreeting(userName)}
        </motion.h1>
        {contextLine && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-1 text-sm text-[#6E6E73] font-mono"
          >
            {contextLine}
          </motion.p>
        )}
      </div>

      {/* AI Chat Input */}
      <div className="px-4 mb-5">
        <AIChatInput
          externalValue={chipHint}
          onExternalValueConsumed={() => setChipHint('')}
        />
      </div>

      {/* Quick chips */}
      <div className="px-4 mb-6">
        <QuickActionChips onChipTap={hint => setChipHint(hint)} />
      </div>

      {/* CRM Stats */}
      <div className="px-4 mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
          DFG CRM · Live
        </p>
        <CRMStatsGrid />
      </div>

      {/* Streak */}
      <div className="px-4 pb-6">
        <StreakTracker streak={0} />
      </div>
    </div>
  )
}
