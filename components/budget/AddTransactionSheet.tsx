'use client'
import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useBudgetStore } from '@/store/budget'

interface AddTransactionSheetProps {
  open: boolean
  onClose: () => void
}

export default function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const { categories, addTransaction } = useBudgetStore()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0]?.name ?? 'Misc')
  const [note, setNote] = useState('')

  const handleAdd = () => {
    const num = Number(amount)
    if (!amount || isNaN(num) || num <= 0) return
    addTransaction({
      amount: num,
      category,
      note,
      date: new Date().toISOString().split('T')[0],
    })
    setAmount('')
    setNote('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Transaction">
      <div className="space-y-4">
        <input
          type="number"
          inputMode="decimal"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                     text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50
                     font-mono text-2xl text-center"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.name)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors
                ${
                  category === c.name
                    ? 'text-white border-transparent'
                    : 'border-white/[0.08] text-[#8a8f9a]'
                }`}
              style={category === c.name ? { background: c.color } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                     text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
        >
          Add Transaction
        </button>
      </div>
    </BottomSheet>
  )
}
