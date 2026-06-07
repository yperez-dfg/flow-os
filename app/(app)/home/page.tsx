'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AIChatInput from '@/components/home/AIChatInput'
import QuickActionChips from '@/components/home/QuickActionChips'
import CRMStatsGrid from '@/components/home/CRMStatsGrid'
import MorningBrief from '@/components/home/MorningBrief'
import { useSettingsStore } from '@/store/settings'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}.`
  if (h < 17) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
}

export default function HomePage() {
  const { userName } = useSettingsStore()
  const [chipHint, setChipHint] = useState('')

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="px-5 pt-14 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display italic text-3xl text-[#1D1D1F] leading-tight"
        >
          {getGreeting(userName)}
        </motion.h1>
      </div>

      <div className="px-4 mb-4">
        <MorningBrief />
      </div>

      <div className="px-4 mb-5">
        <AIChatInput
          externalValue={chipHint}
          onExternalValueConsumed={() => setChipHint('')}
        />
      </div>

      <div className="px-4 mb-6">
        <QuickActionChips onChipTap={hint => setChipHint(hint)} />
      </div>

      <div className="px-4 pb-24">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
          DFG CRM · Live
        </p>
        <CRMStatsGrid />
      </div>
    </div>
  )
}
