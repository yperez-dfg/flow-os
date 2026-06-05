'use client'
import { useBudgetStore } from '@/store/budget'
import { Trash2 } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  Rent: '🏠',
  Food: '🍔',
  Gas: '⛽',
  Subscriptions: '📱',
  Misc: '🛒',
  Transport: '🚗',
  Health: '💊',
  Entertainment: '🎬',
  Clothing: '👗',
  Utilities: '💡',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Today'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TransactionList() {
  const { transactions, deleteTransaction, categories } = useBudgetStore()
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  const getColor = (cat: string) =>
    categories.find((c) => c.name === cat)?.color ?? '#6E6E73'

  // Group by date
  const grouped = sorted.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {} as Record<string, typeof sorted>)

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
        Transactions
      </p>
      {Object.keys(grouped).length === 0 && (
        <p className="text-[#6E6E73] text-sm text-center py-6">No transactions yet</p>
      )}
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txns]) => (
          <div key={date}>
            <p className="text-[10px] font-mono text-[#AEAEB2] mb-2 px-1">{formatDate(date)}</p>
            <div className="space-y-2">
              {txns.map((t) => (
                <div
                  key={t.id}
                  className="apple-card px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: `${getColor(t.category)}18` }}
                  >
                    {CATEGORY_EMOJI[t.category] ?? '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1D1D1F] truncate">
                      {t.note || t.category}
                    </p>
                    <p className="text-[11px] text-[#AEAEB2]">{t.category}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[#ff4d6a] whitespace-nowrap">
                    -${t.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2 -mr-2"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
