'use client'
import { useBudgetStore } from '@/store/budget'

export default function BalanceDisplay() {
  const { monthlyIncome, spentByCategory, setIncome } = useBudgetStore()
  const totalSpent = Object.values(spentByCategory()).reduce((a, b) => a + b, 0)
  const remaining = monthlyIncome - totalSpent
  const isOver = remaining < 0

  return (
    <div
      className="apple-card p-6 text-center"
      style={{ borderLeft: `4px solid ${isOver ? '#ff4d6a' : '#00d084'}` }}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
        Remaining This Month
      </p>
      <p
        className="font-display text-5xl font-bold mb-1"
        style={{ color: isOver ? '#ff4d6a' : '#00d084' }}
      >
        ${Math.abs(remaining).toLocaleString()}
      </p>
      <p className="text-xs text-[#6E6E73]">
        {isOver ? 'over budget · ' : 'of '}${monthlyIncome.toLocaleString()} income
      </p>
      <div className="mt-4 flex items-center gap-2 max-w-[200px] mx-auto">
        <p className="text-xs text-[#6E6E73] whitespace-nowrap">Monthly income:</p>
        <input
          type="number"
          inputMode="numeric"
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-1.5
                     text-sm text-[#1D1D1F] outline-none text-right font-mono
                     focus:border-[#1560FF]/50"
          value={monthlyIncome || ''}
          onChange={(e) => setIncome(Number(e.target.value))}
          placeholder="0"
        />
      </div>
    </div>
  )
}
