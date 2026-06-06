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
  const [due, setDue] = useState('')

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
          Personal Tasks
        </p>
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
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
                  <p className="text-[10px] text-[#AEAEB2] font-mono mt-0.5">{t.due}</p>
                )}
              </div>
              <Badge
                label={t.priority}
                color={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'slate'}
              />
              <button
                onClick={() => deleteTask(t.id)}
                className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2 -mr-1"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {personalTasks.length === 0 && (
          <p className="text-[#6E6E73] text-sm text-center py-6">No tasks — tap + to add one</p>
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
                      ? 'bg-[#1560FF] border-[#1560FF] text-white'
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
