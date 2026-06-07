'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import RecurringExpenses from '@/components/budget/RecurringExpenses'
import { useBudgetStore } from '@/store/budget'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Sparkles } from 'lucide-react'

export default function BudgetPage() {
  const [open, setOpen] = useState(false)
  const { archiveMonth } = useBudgetStore()
  const [archiveToast, setArchiveToast] = useState('')
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachText, setCoachText] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const { categories, transactions, recurringExpenses, monthlyIncome } = useBudgetStore()

  useEffect(() => {
    const store = useBudgetStore.getState()
    const currentMonth = new Date().toISOString().slice(0, 7)
    if (store.month !== currentMonth) {
      const oldMonth = new Date(store.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
      const newMonth = new Date(currentMonth + '-01').toLocaleString('default', { month: 'long' })
      archiveMonth()
      setArchiveToast(`${oldMonth} archived — budget reset for ${newMonth}`)
      setTimeout(() => setArchiveToast(''), 4000)
    }
  }, [archiveMonth])

  async function fetchCoach() {
    setCoachText('')
    setCoachLoading(true)
    setCoachOpen(true)
    try {
      const res = await fetch('/api/budget-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income: monthlyIncome, transactions, categories, recurringExpenses }),
      })
      if (!res.body) { setCoachLoading(false); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setCoachLoading(false)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setCoachText(t => t + decoder.decode(value))
      }
    } catch {
      setCoachLoading(false)
      setCoachText('Could not analyze budget right now.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-4">
      <AnimatePresence>
        {archiveToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1D1D1F] text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg max-w-[360px] text-center"
          >
            {archiveToast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Budget</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoach}
            className="flex items-center gap-1 text-[#1560FF] text-xs font-semibold px-3 py-2 rounded-full bg-[#1560FF]/10 active:scale-90 transition-transform"
            aria-label="Budget advice"
          >
            <Sparkles size={14} />
            <span>Advice</span>
          </button>
          <button
            onClick={() => setOpen(true)}
            className="text-[#1560FF] active:scale-90 transition-transform"
            aria-label="Add transaction"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>
      <BalanceDisplay />
      <RecurringExpenses />
      <div className="w-full h-px bg-[#E5E5EA]" />
      <SpendingChart />
      <TransactionList />
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
      <BottomSheet
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        title="Budget Coach"
        footer={
          <button
            onClick={() => setCoachOpen(false)}
            className="w-full bg-[#F5F5F7] text-[#1D1D1F] font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
          >
            Close
          </button>
        }
      >
        {coachLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-[#E5E5EA] rounded-full animate-pulse" style={{ width: `${60 + i * 15}%` }} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-wrap font-mono">
            {coachText || 'Analyzing your budget…'}
          </p>
        )}
      </BottomSheet>
    </div>
  )
}
