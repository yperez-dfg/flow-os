'use client'
import { useState } from 'react'
import { usePlannerStore } from '@/store/planner'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

const priorityColor: Record<string, 'red' | 'amber' | 'slate'> = {
  High: 'red', Medium: 'amber', Low: 'slate',
}

export default function PersonalTaskList() {
  const { personalTasks, addTask, toggleTask, deleteTask } = usePlannerStore()
  const today = new Date().toISOString().split('T')[0]
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [due, setDue] = useState('')
  const [showDone, setShowDone] = useState(false)

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), done: false, priority, repeat: 'none', due: due || undefined })
    setTitle('')
    setDue('')
    setPriority('Medium')
    setOpen(false)
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  // Group tasks by status
  const overdue  = personalTasks.filter((t) => !t.done && t.due && t.due < today)
  const dueToday = personalTasks.filter((t) => !t.done && t.due === today)
  const upcoming = personalTasks.filter((t) => !t.done && t.due && t.due > today)
  const noDate   = personalTasks.filter((t) => !t.done && !t.due)
  const done     = personalTasks.filter((t) => t.done)

  const isEmpty =
    overdue.length === 0 && dueToday.length === 0 &&
    upcoming.length === 0 && noDate.length === 0

  function TaskCard({ t }: { t: typeof personalTasks[0] }) {
    return (
      <motion.div
        key={t.id}
        layout
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        className="apple-card px-4 py-4 flex items-center gap-3"
      >
        <button
          onClick={() => toggleTask(t.id)}
          className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center
            ${t.done ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
        >
          {t.done && <span className="text-white text-[11px] font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${t.done ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'}`}>
            {t.title}
          </p>
          {t.due && (
            <p className={`text-[10px] font-mono mt-0.5 ${t.due < today && !t.done ? 'text-[#ff4d6a]' : 'text-[#AEAEB2]'}`}>
              {t.due}
            </p>
          )}
        </div>
        <Badge label={t.priority} color={priorityColor[t.priority]} />
        <button
          onClick={() => deleteTask(t.id)}
          className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2 -mr-1"
        >
          <Trash2 size={16} />
        </button>
      </motion.div>
    )
  }

  function Group({
    label,
    tasks,
    accent,
  }: {
    label: string
    tasks: typeof personalTasks
    accent?: string
  }) {
    if (tasks.length === 0) return null
    return (
      <div className="space-y-2">
        <p className={`text-[10px] font-mono uppercase tracking-widest ${accent ?? 'text-[#6E6E73]'}`}>
          {label} · {tasks.length}
        </p>
        <AnimatePresence>
          {tasks.map((t) => (
            <TaskCard key={t.id} t={t} />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Personal Tasks</p>
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-5">
        <Group label="Overdue" tasks={overdue} accent="text-[#ff4d6a]" />
        <Group label="Today" tasks={dueToday} accent="text-[#1560FF]" />
        <Group label="Upcoming" tasks={upcoming} />
        <Group label="No Due Date" tasks={noDate} />

        {isEmpty && (
          <p className="text-[#6E6E73] text-sm text-center py-6">No tasks — tap + to add one</p>
        )}

        {done.length > 0 && (
          <div>
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#AEAEB2] mb-2"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${showDone ? 'rotate-180' : ''}`}
              />
              Done · {done.length}
            </button>
            <AnimatePresence>
              {showDone &&
                done.map((t) => (
                  <TaskCard key={t.id} t={t} />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add Task"
        footer={
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            Add Task
          </button>
        }
      >
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="What do you need to do?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
            autoCorrect="off"
            autoCapitalize="sentences"
            enterKeyHint="done"
          />
          <input
            type="date"
            className={inputCls}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Priority</p>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Medium', 'Low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-4 rounded-2xl text-sm font-semibold border transition-colors
                    ${priority === p
                      ? p === 'High' ? 'bg-[#ff4d6a] border-[#ff4d6a] text-white'
                        : p === 'Medium' ? 'bg-[#FF9F0A] border-[#FF9F0A] text-white'
                        : 'bg-[#8E8E93] border-[#8E8E93] text-white'
                      : 'border-[#E5E5EA] text-[#6E6E73] bg-[#F5F5F7]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
