'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlannerStore } from '@/store/planner'
import { useFitnessStore } from '@/store/fitness'
import { useBudgetStore } from '@/store/budget'
import { useCalendarStore } from '@/store/calendar'
import { useSettingsStore } from '@/store/settings'
import { sb, fromSnake, type CRMTask } from '@/lib/supabase'

interface BriefData {
  bullets: string[]
  focus: string
}

export default function MorningBrief() {
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const { personalTasks } = usePlannerStore()
  const { workoutSchedule, workoutStreak, caloriesConsumed } = useFitnessStore()
  const { calorieGoal } = useSettingsStore()
  const { transactions, monthlyIncome } = useBudgetStore()
  const { events } = useCalendarStore()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayDay = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)[new Date().getDay()]
    const workout = workoutSchedule.find(d => d.day === todayDay)?.type ?? 'Rest Day'

    const calendarEvents = events
      .filter(e => e.date === today)
      .map(e => ({ title: e.title, time: e.time }))

    const spent = transactions.reduce((s, t) => s + t.amount, 0)
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate()

    ;(async () => {
      try {
        // 1. Check Supabase cache first — never localStorage
        const { data: cached } = await sb
          .from('morning_briefs')
          .select('bullets, focus')
          .eq('date', today)
          .single()
        if (cached?.focus) {
          setBrief({ bullets: cached.bullets as string[], focus: cached.focus })
          setLoading(false)
          return
        }

        // 2. Pull CRM tasks due today
        const { data: taskData } = await sb
          .from('tasks')
          .select('*')
          .eq('done', false)
          .lte('due', today)
        const crmTasksDueToday = (taskData ?? [])
          .map((r) => fromSnake<CRMTask>(r))
          .map(t => ({ title: t.title, related: t.related }))

        // 3. Call Groq
        const res = await fetch('/api/morning-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today,
            dayOfWeek,
            workout,
            personalTasks: personalTasks.filter(t => !t.done).slice(0, 5).map(t => ({ title: t.title, priority: t.priority })),
            crmTasksDueToday: crmTasksDueToday.slice(0, 5),
            calendarEvents,
            budget: { spent: Math.round(spent), income: monthlyIncome, daysLeftInMonth: daysLeft },
            calories: { yesterday: caloriesConsumed(), goal: calorieGoal },
          }),
        })
        const data: BriefData = await res.json()

        if (data.focus) {
          setBrief(data)
          // 4. Persist to Supabase (upsert in case of race)
          await sb.from('morning_briefs').upsert({
            date: today,
            bullets: data.bullets,
            focus: data.focus,
            created_at: new Date().toISOString(),
          })
        }
      } catch { /* silent fail — brief just won't show */ } finally {
        setLoading(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="apple-card px-5 py-4 space-y-2">
        <div className="h-4 bg-[#E5E5EA] rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-[#E5E5EA] rounded-full animate-pulse w-1/2" />
        <div className="h-3 bg-[#E5E5EA] rounded-full animate-pulse w-2/3" />
      </div>
    )
  }

  if (!brief || !brief.focus) return null

  return (
    <div className="apple-card px-5 py-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display italic text-base text-[#1D1D1F] flex-1 leading-snug">
            {brief.focus}
          </p>
          {workoutStreak > 0 && (
            <span className="flex-shrink-0 text-[11px] font-mono font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 px-2 py-1 rounded-full">
              🔥 {workoutStreak}d
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-[#AEAEB2] mt-1">
          {expanded ? '▴ Today\'s brief' : '▾ Today\'s brief'}
        </p>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2 mt-3"
          >
            {brief.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
                <span className="text-[#1560FF] font-mono flex-shrink-0">·</span>
                {b}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
