'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlannerStore, type Routine } from '@/store/planner'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Pencil, Trash2, X, Check, RotateCcw } from 'lucide-react'

const EMOJI_OPTIONS = ['☀️', '🌙', '💪', '🌱', '🧘', '🚿', '🍳', '📚', '🏃', '✨']

export default function Routines() {
  const { routines, addRoutine, editRoutine, deleteRoutine, toggleRoutineStep, resetRoutine } =
    usePlannerStore()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Routine | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0])
  const [steps, setSteps] = useState<string[]>([''])
  const [openRoutineId, setOpenRoutineId] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  function openNew() {
    setEditing(null)
    setName('')
    setEmoji(EMOJI_OPTIONS[0])
    setSteps([''])
    setSheetOpen(true)
  }

  function openEdit(r: Routine) {
    setEditing(r)
    setName(r.name)
    setEmoji(r.emoji)
    setSteps(r.steps.map((s) => s.title).concat(''))
    setSheetOpen(true)
  }

  function updateStep(i: number, v: string) {
    setSteps((s) => s.map((x, idx) => (idx === i ? v : x)))
  }

  function addStepField() {
    setSteps((s) => [...s, ''])
  }

  function removeStepField(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)
    if (!name.trim() || cleanSteps.length === 0) return

    if (editing) {
      // Map back to RoutineStep[] — preserve IDs where titles match, new IDs for added
      const oldByTitle = new Map(editing.steps.map((s) => [s.title, s.id]))
      const newSteps = cleanSteps.map((title) => ({
        id: oldByTitle.get(title) ?? crypto.randomUUID(),
        title,
      }))
      editRoutine(editing.id, { name: name.trim(), emoji, steps: newSteps })
    } else {
      addRoutine({ name, emoji, steps: cleanSteps })
    }

    setSheetOpen(false)
    setEditing(null)
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Routines</p>
          <p className="text-[10px] text-[#AEAEB2] mt-0.5">Resets daily</p>
        </div>
        <button
          onClick={openNew}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#00d084]/10 text-[#00d084] active:scale-90 transition-transform"
          aria-label="Add routine"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {routines.map((r) => {
            // Reset progress display if it's a new day
            const isCurrentDay = r.progressDate === today
            const completedIds = isCurrentDay ? r.completedStepIds : []
            const done = completedIds.length
            const total = r.steps.length
            const pct = total > 0 ? (done / total) * 100 : 0
            const allDone = done === total && total > 0
            const expanded = openRoutineId === r.id

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="apple-card overflow-hidden"
              >
                {/* Header — tap to expand */}
                <button
                  onClick={() => setOpenRoutineId(expanded ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 active:bg-[#F5F5F7]/50 transition-colors text-left"
                >
                  <div className="text-2xl flex-shrink-0">{r.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1D1D1F] leading-snug">{r.name}</p>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5 font-mono">
                      {done} / {total} {allDone && '✓'}
                    </p>
                    <div className="w-full bg-[#E5E5EA] rounded-full h-1.5 mt-2">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ background: allDone ? '#00d084' : '#1560FF' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#AEAEB2] flex-shrink-0"
                  >
                    ▾
                  </motion.div>
                </button>

                {/* Expanded — steps + actions */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#E5E5EA]"
                    >
                      <div className="p-3 space-y-1.5">
                        {r.steps.map((step) => {
                          const isDone = completedIds.includes(step.id)
                          return (
                            <button
                              key={step.id}
                              onClick={() => toggleRoutineStep(r.id, step.id)}
                              className="w-full flex items-center gap-3 px-3 py-3 bg-[#F5F5F7] rounded-xl active:scale-[0.98] transition-transform text-left"
                            >
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                                  ${isDone ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
                              >
                                {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              <p
                                className={`text-sm font-medium flex-1 ${
                                  isDone ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'
                                }`}
                              >
                                {step.title}
                              </p>
                            </button>
                          )
                        })}
                      </div>

                      {/* Routine controls */}
                      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-[#F2F2F7]">
                        <button
                          onClick={() => resetRoutine(r.id)}
                          className="flex items-center gap-1 text-[11px] text-[#6E6E73] active:text-[#1560FF] py-2 px-2 transition-colors"
                        >
                          <RotateCcw size={12} /> Reset
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-[#AEAEB2] active:text-[#1560FF] transition-colors p-2"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteRoutine(r.id)}
                            className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {routines.length === 0 && (
          <div className="apple-card p-5 text-center">
            <p className="text-2xl mb-2">☀️</p>
            <p className="text-[#6E6E73] text-sm">No routines yet</p>
            <p className="text-[10px] text-[#AEAEB2] mt-1">
              Create a morning routine, evening wind-down, or workout flow
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Routine' : 'New Routine'}
        footer={
          <button
            onClick={handleSave}
            disabled={!name.trim() || steps.filter((s) => s.trim()).length === 0}
            className="w-full bg-[#00d084] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            {editing ? 'Save Changes' : 'Create Routine'}
          </button>
        }
      >
        <div className="space-y-4">
          {/* Name */}
          <input
            className={inputCls}
            placeholder="Morning Routine"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoCapitalize="words"
            enterKeyHint="next"
          />

          {/* Emoji picker */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
              Icon
            </p>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`aspect-square text-2xl rounded-2xl border-2 transition-colors flex items-center justify-center
                    ${emoji === e ? 'border-[#00d084] bg-[#00d084]/10' : 'border-transparent bg-[#F5F5F7]'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
              Steps
            </p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#AEAEB2] w-5 flex-shrink-0 text-right">
                    {i + 1}
                  </span>
                  <input
                    className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-3 text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base"
                    placeholder={
                      i === 0 ? 'Take supplements' :
                      i === 1 ? 'Walk dogs' :
                      i === 2 ? '100 pushups' :
                      'Add a step…'
                    }
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && step.trim()) {
                        e.preventDefault()
                        if (i === steps.length - 1) addStepField()
                      }
                    }}
                    autoCapitalize="sentences"
                    enterKeyHint={i === steps.length - 1 ? 'done' : 'next'}
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStepField(i)}
                      className="w-8 h-8 rounded-full text-[#AEAEB2] active:text-[#ff4d6a] flex items-center justify-center flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addStepField}
              className="mt-2 flex items-center gap-2 text-[#1560FF] text-sm font-medium px-3 py-2 active:opacity-60"
            >
              <Plus size={14} /> Add another step
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
