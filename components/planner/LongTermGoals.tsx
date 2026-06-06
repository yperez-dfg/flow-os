'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlannerStore, type LongTermGoal, type GoalCategory } from '@/store/planner'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const CATEGORIES: { label: GoalCategory; emoji: string; color: string }[] = [
  { label: 'Work',     emoji: '💼', color: '#1560FF' },
  { label: 'Health',   emoji: '💪', color: '#00d084' },
  { label: 'Finance',  emoji: '💰', color: '#FF9F0A' },
  { label: 'Personal', emoji: '⭐', color: '#a855f7' },
  { label: 'Learning', emoji: '📚', color: '#00d4ff' },
]

const EMPTY = {
  title: '',
  description: '',
  category: 'Personal' as GoalCategory,
  targetDate: '',
  progress: 0,
}

function daysLeft(targetDate: string): number {
  const diff = new Date(targetDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function timelineProgress(createdAt: string, targetDate: string): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(targetDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100)
}

function defaultTargetDate() {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
}

export default function LongTermGoals() {
  const { longTermGoals, addLongTermGoal, editLongTermGoal, deleteLongTermGoal, updateLongTermProgress } = usePlannerStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<LongTermGoal | null>(null)
  const [form, setForm] = useState({ ...EMPTY, targetDate: defaultTargetDate() })
  const [progressEdit, setProgressEdit] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, targetDate: defaultTargetDate() })
    setSheetOpen(true)
  }

  function openEdit(g: LongTermGoal) {
    setEditing(g)
    setForm({
      title: g.title,
      description: g.description ?? '',
      category: g.category,
      targetDate: g.targetDate,
      progress: g.progress,
    })
    setSheetOpen(true)
  }

  function handleSave() {
    if (!form.title.trim() || !form.targetDate) return
    if (editing) {
      editLongTermGoal(editing.id, { ...form, title: form.title.trim(), description: form.description || undefined })
    } else {
      addLongTermGoal({ ...form, title: form.title.trim(), description: form.description || undefined })
    }
    setSheetOpen(false)
    setEditing(null)
    setForm({ ...EMPTY, targetDate: defaultTargetDate() })
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Long-Term Goals</p>
          <p className="text-[10px] text-[#AEAEB2] mt-0.5">3–6 months out</p>
        </div>
        <button
          onClick={openNew}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#a855f7]/10 text-[#a855f7] active:scale-90 transition-transform"
          aria-label="Add long-term goal"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {longTermGoals.map((g) => {
            const cat = CATEGORIES.find(c => c.label === g.category)!
            const days = daysLeft(g.targetDate)
            const overdue = days < 0
            const timePct = timelineProgress(g.createdAt, g.targetDate)
            const done = g.progress >= 100

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="apple-card p-4"
                style={{ borderLeft: `3px solid ${cat.color}` }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-base flex-shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1D1D1F] leading-snug">{g.title}</p>
                    {g.description && (
                      <p className="text-[11px] text-[#6E6E73] mt-0.5 leading-snug">{g.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(g)} className="text-[#AEAEB2] active:text-[#1560FF] p-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteLongTermGoal(g.id)} className="text-[#AEAEB2] active:text-[#ff4d6a] p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 mt-2">
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full
                      ${overdue ? 'bg-[#ff4d6a]/10 text-[#ff4d6a]'
                        : days <= 14 ? 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                        : 'bg-[#F5F5F7] text-[#6E6E73]'}`}
                  >
                    {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                  </span>
                  <span className="text-[10px] text-[#AEAEB2]">
                    {new Date(g.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="mb-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-[#6E6E73]">Progress</p>
                    {progressEdit === g.id ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0} max={100}
                        className="w-16 text-right text-xs font-mono bg-transparent outline-none text-[#1D1D1F]"
                        defaultValue={g.progress}
                        autoFocus
                        onBlur={e => {
                          updateLongTermProgress(g.id, Number(e.target.value))
                          setProgressEdit(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            updateLongTermProgress(g.id, Number((e.target as HTMLInputElement).value))
                            setProgressEdit(null)
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setProgressEdit(g.id)}
                        className={`text-xs font-mono font-semibold ${done ? 'text-[#00d084]' : 'text-[#1560FF]'}`}
                      >
                        {g.progress}%{done ? ' ✓' : ' ✎'}
                      </button>
                    )}
                  </div>
                  <div className="relative w-full h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full opacity-20"
                      style={{ width: `${timePct}%`, background: cat.color }}
                    />
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ background: done ? '#00d084' : cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-[9px] text-[#AEAEB2] mt-1">
                    Tap % to update · faint bar = time elapsed
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {longTermGoals.length === 0 && (
          <div className="apple-card p-5 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-[#6E6E73] text-sm">No long-term goals yet</p>
            <p className="text-[10px] text-[#AEAEB2] mt-1">Set a 3–6 month goal to track big picture progress</p>
          </div>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null) }}
        title={editing ? 'Edit Goal' : 'New Long-Term Goal'}
        footer={
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || !form.targetDate}
            className="w-full bg-[#a855f7] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            {editing ? 'Save Changes' : 'Add Goal'}
          </button>
        }
      >
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Goal title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
            autoCapitalize="sentences"
            enterKeyHint="next"
          />
          <textarea
            className={`${inputCls} resize-none`}
            placeholder="Description (optional)"
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Category</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.label}
                  onClick={() => setForm(f => ({ ...f, category: c.label }))}
                  className={`py-3 rounded-2xl text-xs font-semibold border transition-colors flex flex-col items-center gap-1
                    ${form.category === c.label ? 'text-white border-transparent' : 'border-[#E5E5EA] text-[#6E6E73] bg-[#F5F5F7]'}`}
                  style={form.category === c.label ? { background: c.color } : {}}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Target Date</p>
            <input
              type="date"
              className={inputCls}
              value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
            />
          </div>

          {editing && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Progress (%)</p>
              <input
                type="number"
                inputMode="numeric"
                min={0} max={100}
                className={inputCls}
                value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
              />
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
