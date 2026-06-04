'use client'
import { Flame } from 'lucide-react'

interface StreakTrackerProps {
  streak: number
}

export default function StreakTracker({ streak }: StreakTrackerProps) {
  return (
    <div className="flex items-center gap-3 glass px-4 py-3">
      <Flame size={24} className="text-[#ffb547] flex-shrink-0" />
      <div>
        <p className="font-display font-bold text-lg leading-tight">{streak} day streak</p>
        <p className="text-[10px] text-[#8a8f9a]">Keep hitting your daily goals</p>
      </div>
    </div>
  )
}
