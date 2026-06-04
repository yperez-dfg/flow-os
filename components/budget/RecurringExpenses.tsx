'use client'
import { useState } from 'react'
import { useBudgetStore } from '@/store/budget'
import { useCalendarStore } from '@/store/calendar'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

function getNextDueDate(dueDay: number): string {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (thisMonth <= today) thisMonth.setMonth(thisMonth.getMonth() + 1)
  return thisMonth.toISOString().split('T')[0]
}

function ordinal(n: number): string {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

export default function RecurringExpenses() {
  const { recurringExpenses, categories, addRecurringExpense, removeRecurringExpense } = useBudgetStore()
  const { addEvent } = useCalendarStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('1')
  const [category, setCategory] = useState(categories[0]?.name ?? 'Rent')

  const handleAdd = () => {
    if (!name.trim() || !amount) return
    const cat = categories.find(c => c.name === category)
    const expense = {
      name: name.trim(),
      amount: Number(amount),
      category,
      dueDay: Number(dueDay),
      color: cat?.color ?? '#1560FF',
      active: true,
    }
    addRecurringExpense(expense)

    // Auto-add to calendar as monthly recurring event
    addEvent({
      title: `💳 ${name.trim()} — $${amount}`,
      date: getNextDueDate(Number(dueDay)),
      color: expense.color,
      repeat: 'monthly',
      notify: true,
      notifyMinutesBefore: 1440,
      type: 'personal',
      notes: `Recurring bill: $${amount} due on the ${ordinal(Number(dueDay))}`,
    })

    setName(''); setAmount(''); setDueDay('1'); setOpen(false)
  }

  const totalCommitted = recurringExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Monthly Bills</p>
          <p className="text-xs text-[#6E6E73] mt-0.5">${totalCommitted.toLocaleString()} committed/month</p>
        </div>
        <button onClick={() => setOpen(true)} className="text-[#1560FF] active:scale-90 transition-transform" type="button">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {recurringExpenses.map(e => (
          <div key={e.id} className="apple-card p-3 flex items-center gap-3"
            style={{ borderLeft: `3px solid ${e.color}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1D1D1F]">{e.name}</p>
              <p className="text-[10px] text-[#6E6E73] font-mono">
                {e.category} · due {ordinal(e.dueDay)}
              </p>
            </div>
            <p className="font-mono text-sm font-semibold text-[#1D1D1F]">${e.amount}</p>
            <button onClick={() => removeRecurringExpense(e.id)} type="button"
              className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {recurringExpenses.length === 0 && (
          <p className="text-[#6E6E73] text-sm text-center py-4">No recurring bills — add rent, subscriptions, etc.</p>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Monthly Bill">
        <div className="space-y-4">
          <input className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                           text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]"
            placeholder="Bill name (e.g. Rent, Netflix)" value={name}
            onChange={e => setName(e.target.value)} autoFocus />
          <input type="number" inputMode="decimal"
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF] font-mono"
            placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} />
          <div>
            <p className="text-xs text-[#6E6E73] mb-2">Due on the</p>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="28"
                className="w-20 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                           text-[#1D1D1F] outline-none focus:border-[#1560FF] font-mono text-center"
                value={dueDay} onChange={e => setDueDay(e.target.value)} />
              <span className="text-sm text-[#6E6E73]">of each month</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => setCategory(c.name)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors
                  ${category === c.name ? 'text-white border-transparent' : 'border-[#E5E5EA] text-[#6E6E73]'}`}
                style={category === c.name ? { background: c.color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} type="button"
            className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform">
            Add Bill + Auto-Calendar
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
