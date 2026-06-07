'use client'
import { useState } from 'react'
import { useBudgetStore } from '@/store/budget'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

const COLOR_OPTIONS = ['#1560FF', '#00d084', '#ffb547', '#a855f7', '#ff4d6a', '#00d4ff']

export default function ManageCategories() {
  const { categories, transactions, addCategory, removeCategory } = useBudgetStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [cap, setCap] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])

  function handleAdd() {
    if (!name.trim() || !cap) return
    addCategory({ name: name.trim(), cap: Number(cap), color })
    setName('')
    setCap('')
    setColor(COLOR_OPTIONS[0])
    setSheetOpen(false)
  }

  function canDelete(categoryId: string): boolean {
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return false
    return !transactions.some(t => t.category === cat.name)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Categories</p>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add category"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(cat => {
          const deletable = canDelete(cat.id)
          return (
            <div key={cat.id} className="apple-card p-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <p className="flex-1 text-sm font-medium text-[#1D1D1F]">{cat.name}</p>
              <p className="font-mono text-xs text-[#6E6E73]">${cat.cap}/mo</p>
              <button
                onClick={() => deletable && removeCategory(cat.id)}
                className={`p-2 transition-colors ${deletable ? 'text-[#AEAEB2] active:text-[#ff4d6a]' : 'text-[#E5E5EA] cursor-not-allowed'}`}
                aria-label={deletable ? 'Delete category' : 'Category in use'}
                disabled={!deletable}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Add Category"
        footer={
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !cap}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            Add Category
          </button>
        }
      >
        <div className="space-y-4">
          <input
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base"
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            autoCapitalize="words"
            enterKeyHint="next"
          />
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 font-mono text-base"
            placeholder="Monthly cap ($)"
            value={cap}
            onChange={e => setCap(e.target.value)}
            enterKeyHint="done"
          />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Color</p>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all active:scale-90
                    ${color === c ? 'border-[#1D1D1F] scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
