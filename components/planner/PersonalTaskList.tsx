'use client'
import { useState } from 'react'
import { usePlannerStore } from '@/store/planner'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

export default function PersonalTaskList() {
  const { personalTasks, addTask, toggleTask, deleteTask } = usePlannerStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), done: false, priority, repeat: 'none' })
    setTitle('')
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
          Personal Tasks
        </p>
        <button
          onClick={() => setOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add personal task"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {personalTasks.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="apple-card p-3 flex items-center gap-3"
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center
                  ${t.done ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
                aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.done && <span className="text-white text-[10px] font-bold">✓</span>}
              </button>
              <p
                className={`flex-1 text-sm ${
                  t.done ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'
                }`}
              >
                {t.title}
              </p>
              <Badge
                label={t.priority}
                color={
                  t.priority === 'High'
                    ? 'red'
                    : t.priority === 'Medium'
                    ? 'amber'
                    : 'slate'
                }
              />
              <button
                onClick={() => deleteTask(t.id)}
                className="text-[#6E6E73] active:text-[#ff4d6a] transition-colors"
                aria-label="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {personalTasks.length === 0 && (
          <p className="text-[#6E6E73] text-sm text-center py-6">
            No personal tasks — tap + to add one
          </p>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Task">
        <div className="space-y-4">
          <input
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div className="flex gap-2">
            {(['High', 'Medium', 'Low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors
                  ${
                    priority === p
                      ? 'bg-[#1560FF] border-[#1560FF] text-white'
                      : 'border-[#E5E5EA] text-[#6E6E73]'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Add Task
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
