'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sb, fromSnake, toSnake, type CRMTask } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import BottomSheet from '@/components/ui/BottomSheet'
import { RefreshCw, Plus, Trash2, Pencil, Check } from 'lucide-react'

const PRIORITIES = ['High', 'Medium', 'Low'] as const
const priorityColor: Record<string, 'red' | 'amber' | 'slate'> = {
  High: 'red', Medium: 'amber', Low: 'slate',
}

const EMPTY: Omit<CRMTask, 'id' | 'done'> = {
  title: '', due: '', priority: 'Medium', related: '',
}

export default function CRMTaskList() {
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<CRMTask | null>(null)
  const [form, setForm] = useState<Omit<CRMTask, 'id' | 'done'>>(EMPTY)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data } = await sb
      .from('tasks')
      .select('*')
      .eq('done', false)
      .order('due', { ascending: true })
    setTasks((data ?? []).map((r) => fromSnake<CRMTask>(r)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setSheetOpen(true)
  }

  function openEdit(task: CRMTask) {
    setEditing(task)
    setForm({ title: task.title, due: task.due, priority: task.priority, related: task.related })
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditing(null)
    setForm(EMPTY)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await sb.from('tasks').update(toSnake({ ...form, title: form.title.trim() })).eq('id', editing.id)
      } else {
        await sb.from('tasks').insert(toSnake({ ...form, title: form.title.trim(), done: false }))
      }
      closeSheet()
      await fetchTasks()
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(task: CRMTask) {
    await sb.from('tasks').update({ done: true }).eq('id', task.id)
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  async function handleDelete(task: CRMTask) {
    await sb.from('tasks').delete().eq('id', task.id)
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
          CRM Tasks
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="text-[#6E6E73] active:text-[#1560FF] transition-colors p-2"
            aria-label="Refresh CRM tasks"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openNew}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
            aria-label="Add CRM task"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="apple-card p-3 flex items-start gap-3"
            >
              <button
                onClick={() => handleComplete(t)}
                className="w-7 h-7 rounded-full border-2 border-[#C7C7CC] flex-shrink-0 flex items-center justify-center mt-0.5 active:bg-[#00d084] active:border-[#00d084] transition-colors"
                aria-label="Mark complete"
              >
                <Check size={12} className="text-transparent" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge label="DFG" color="blue" />
                  <Badge label={t.priority} color={priorityColor[t.priority]} />
                </div>
                <p className="text-sm font-medium text-[#1D1D1F]">{t.title}</p>
                {t.related && (
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">{t.related}</p>
                )}
              </div>

              <p className="font-mono text-[10px] text-[#6E6E73] whitespace-nowrap flex-shrink-0">
                {t.due}
              </p>

              <button
                onClick={() => openEdit(t)}
                className="text-[#AEAEB2] active:text-[#1560FF] transition-colors p-2 flex-shrink-0"
                aria-label="Edit task"
              >
                <Pencil size={14} />
              </button>

              <button
                onClick={() => handleDelete(t)}
                className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2 flex-shrink-0"
                aria-label="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && tasks.length === 0 && (
          <p className="text-[#6E6E73] text-sm text-center py-6">
            No open CRM tasks — tap + to add one
          </p>
        )}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="apple-card p-3 h-16 animate-pulse bg-[#F9F9F9]" />
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editing ? 'Edit Task' : 'New CRM Task'}
        footer={
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || saving}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving
              ? <RefreshCw size={16} className="animate-spin" />
              : editing ? 'Save Changes' : 'Add Task'}
          </button>
        }
      >
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Task title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
            autoCapitalize="sentences"
            enterKeyHint="next"
          />

          <input
            className={inputCls}
            placeholder="Related contact or company"
            value={form.related}
            onChange={e => setForm(f => ({ ...f, related: e.target.value }))}
            autoCapitalize="words"
            enterKeyHint="next"
          />

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Due Date</p>
            <input
              type="date"
              className={inputCls}
              value={form.due}
              onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
            />
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Priority</p>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`py-4 rounded-2xl text-sm font-semibold border transition-colors
                    ${form.priority === p
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
