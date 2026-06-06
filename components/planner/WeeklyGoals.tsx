'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlannerStore, type WeeklyGoal } from '@/store/planner'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Pencil, Trash2, Minus } from 'lucide-react'

const EMPTY = { title: '', target: 5, current: 0, unit: 'times' }

export default function WeeklyGoals() {
  const { weeklyGoals, addGoal, editGoal, deleteGoal, updateGoalProgress } = usePlannerStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<WeeklyGoal | null>(null)
  const [form, setForm] = useState(EMPTY)

  const weekOf = (() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().split('T')[0]
  })()

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setSheetOpen(true)
  }

  function openEdit(g: WeeklyGoal) {
    setEditing(g)
    setForm({ title: g.title, target: g.target, current: g.current, unit: g.unit })
    setSheetOpen(true)
  }

  function handleSave() {
    if (!form.title.trim() || form.target <= 0) return
    if (editing) {
      editGoal(editing.id, { ...form, title: form.title.trim() })
    } else {
      addGoal({ ...form, title: form.title.trim(), weekOf })
    }
    setSheetOpen(false)
    setEditing(null)
    setForm(EMPTY)
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
          Weekly Goals
        </p>
        <button
          onClick={openNew}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add weekly goal"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {weeklyGoals.map((g) => {
            const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0
            const done = g.current >= g.target
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="apple-card p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-sm font-medium text-[#1D1D1F] flex-1">{g.title}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      className="text-[#AEAEB2] active:text-[#1560FF] transition-colors p-2"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="w-full bg-[#E5E5EA] rounded-full h-1.5 mb-3">
                  <motion.div
                    className="h-1.5 rounded-full"
                    style={{ background: done ? '#00d084' : '#1560FF' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-semibold ${done ? 'text-[#00d084]' : 'text-[#6E6E73]'}`}>
                    {g.current} / {g.target} {g.unit}
                    {done && ' ✓'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateGoalProgress(g.id, Math.max(0, g.current - 1))}
                      className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center active:scale-90 transition-transform"
                      disabled={g.current <= 0}
                    >
                      <Minus size={14} className={g.current <= 0 ? 'text-[#AEAEB2]' : 'text-[#1D1D1F]'} />
                    </button>
                    <span className="font-mono text-sm font-bold text-[#1D1D1F] w-6 text-center">
                      {g.current}
                    </span>
                    <button
                      onClick={() => updateGoalProgress(g.id, g.current + 1)}
                      className="w-9 h-9 rounded-full bg-[#1560FF] text-white flex items-center justify-center active:scale-90 transition-transform"
                      disabled={done}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {weeklyGoals.length === 0 && (
          <div className="apple-card p-5 text-center">
            <p className="text-[#6E6E73] text-sm">No weekly goals yet</p>
            <p className="text-[10px] text-[#AEAEB2] mt-1">Tap + to set one</p>
          </div>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null) }}
        title={editing ? 'Edit Goal' : 'New Weekly Goal'}
        footer={
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || form.target <= 0}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            {editing ? 'Save Changes' : 'Add Goal'}
          </button>
        }
      >
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Goal title (e.g. Work out, Read)"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
            autoCapitalize="sentences"
            enterKeyHint="next"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Target</p>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="5"
                value={form.target || ''}
                onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
              />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Unit</p>
              <input
                className={inputCls}
                placeholder="times, hrs…"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                enterKeyHint="done"
              />
            </div>
          </div>
          {editing && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Current Progress</p>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                value={form.current || ''}
                onChange={e => setForm(f => ({ ...f, current: Number(e.target.value) }))}
              />
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
