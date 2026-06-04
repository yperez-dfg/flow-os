'use client'
import { useState } from 'react'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import { Plus } from 'lucide-react'

export default function BudgetPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Budget</h1>
        <button
          onClick={() => setOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add transaction"
        >
          <Plus size={22} />
        </button>
      </div>
      <BalanceDisplay />
      <SpendingChart />
      <TransactionList />
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
