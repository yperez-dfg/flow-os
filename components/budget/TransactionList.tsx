'use client'
import { useBudgetStore } from '@/store/budget'
import { Trash2 } from 'lucide-react'

export default function TransactionList() {
  const { transactions, deleteTransaction, categories } = useBudgetStore()
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  const getColor = (cat: string) =>
    categories.find((c) => c.name === cat)?.color ?? '#8a8f9a'

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
        Transactions
      </p>
      <div className="space-y-2">
        {sorted.map((t) => (
          <div key={t.id} className="glass p-3 flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: getColor(t.category) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#edeef2] truncate">
                {t.note || t.category}
              </p>
              <p className="text-[10px] text-[#8a8f9a] font-mono">
                {t.category} · {t.date}
              </p>
            </div>
            <p className="font-mono text-sm font-semibold text-[#ff4d6a] whitespace-nowrap">
              -${t.amount}
            </p>
            <button
              onClick={() => deleteTransaction(t.id)}
              className="text-[#8a8f9a] active:text-[#ff4d6a] transition-colors"
              aria-label="Delete transaction"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-[#8a8f9a] text-sm text-center py-6">
            No transactions yet
          </p>
        )}
      </div>
    </div>
  )
}
