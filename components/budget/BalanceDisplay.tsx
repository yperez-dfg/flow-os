'use client'
import { useState } from 'react'
import { useBudgetStore } from '@/store/budget'
import { Pencil, Check } from 'lucide-react'

export default function BalanceDisplay() {
  const { monthlyIncome, spentByCategory, setIncome } = useBudgetStore()
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')

  const totalSpent = Object.values(spentByCategory()).reduce((a, b) => a + b, 0)
  const remaining = monthlyIncome - totalSpent
  const isOver = remaining < 0
  const pct = monthlyIncome > 0 ? Math.min((totalSpent / monthlyIncome) * 100, 100) : 0

  const handleIncomeSubmit = () => {
    const n = Number(incomeInput)
    if (!isNaN(n) && n > 0) setIncome(n)
    setEditingIncome(false)
  }

  return (
    <div className="apple-card p-5 space-y-4">
      {/* Three stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Income */}
        <div className="text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#6E6E73] mb-1">Income</p>
          {editingIncome ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-[#6E6E73]">$</span>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                className="w-full bg-[#F5F5F7] rounded-lg px-2 py-1 text-sm font-mono text-[#1D1D1F] outline-none text-center"
                placeholder={String(monthlyIncome || '')}
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleIncomeSubmit()}
                onBlur={handleIncomeSubmit}
              />
              <button onClick={handleIncomeSubmit} className="text-[#00d084]">
                <Check size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-semibold font-mono text-[#1D1D1F]">
                ${monthlyIncome > 0 ? monthlyIncome.toLocaleString() : '—'}
              </p>
              <button
                onClick={() => { setIncomeInput(String(monthlyIncome)); setEditingIncome(true) }}
                className="text-[#AEAEB2] active:text-[#1560FF]"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Spent */}
        <div className="text-center border-x border-[#E5E5EA]">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#6E6E73] mb-1">Spent</p>
          <p className="text-lg font-semibold font-mono text-[#ff4d6a]">
            ${totalSpent.toLocaleString()}
          </p>
        </div>

        {/* Remaining */}
        <div className="text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#6E6E73] mb-1">Left</p>
          <p className={`text-lg font-semibold font-mono ${isOver ? 'text-[#ff4d6a]' : 'text-[#00d084]'}`}>
            {isOver ? '-' : ''}${Math.abs(remaining).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {monthlyIncome > 0 && (
        <div>
          <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isOver ? '#ff4d6a' : pct >= 80 ? '#ffb547' : '#00d084',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#6E6E73] font-mono">{pct.toFixed(0)}% spent</span>
            {isOver && (
              <span className="text-[10px] text-[#ff4d6a] font-medium">Over budget!</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
