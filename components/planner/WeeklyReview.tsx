'use client'
import { useState } from 'react'
import { usePlannerStore } from '@/store/planner'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown } from 'lucide-react'

export default function WeeklyReview() {
  const { personalTasks, toggleTask, deleteTask } = usePlannerStore()
  const [open, setOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weekAgo = sevenDaysAgo.toISOString().split('T')[0]

  // Tasks that were due in the past 7 days and are still not done
  const missed = personalTasks.filter(
    (t) => !t.done && t.due && t.due >= weekAgo && t.due < today
  )

  if (missed.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-[#FF9F0A]" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF9F0A]">
            Weekly Review · {missed.length} missed
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#AEAEB2] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            <p className="text-xs text-[#6E6E73] mb-3">
              These tasks were due in the past 7 days. Mark done or delete to clear them.
            </p>
            {missed.map((t) => (
              <div
                key={t.id}
                className="apple-card px-4 py-3 flex items-center gap-3 border-l-2 border-[#FF9F0A]"
              >
                <button
                  onClick={() => toggleTask(t.id)}
                  className="w-6 h-6 rounded-full border-2 border-[#C7C7CC] flex-shrink-0 flex items-center justify-center active:bg-[#00d084] active:border-[#00d084] transition-colors"
                  aria-label="Mark done"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1D1D1F]">{t.title}</p>
                  <p className="text-[10px] font-mono text-[#ff4d6a] mt-0.5">Due {t.due}</p>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-1 text-base font-mono leading-none"
                  aria-label="Remove task"
                >
                  ×
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
