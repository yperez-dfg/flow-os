'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import RecurringExpenses from '@/components/budget/RecurringExpenses'
import { useBudgetStore } from '@/store/budget'
import { Plus } from 'lucide-react'

export default function BudgetPage() {
  const [open, setOpen] = useState(false)
  const { archiveMonth } = useBudgetStore()
  const [archiveToast, setArchiveToast] = useState('')

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
        <button
          onClick={() => setOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add transaction"
        >
          <Plus size={22} />
        </button>
      </div>
      <BalanceDisplay />
      <RecurringExpenses />
      <div className="w-full h-px bg-[#E5E5EA]" />
      <SpendingChart />
      <TransactionList />
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
