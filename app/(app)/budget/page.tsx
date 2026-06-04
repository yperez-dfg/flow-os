'use client'
import { useState } from 'react'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import RecurringExpenses from '@/components/budget/RecurringExpenses'
import { Plus } from 'lucide-react'

export default function BudgetPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4 space-y-4">
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
