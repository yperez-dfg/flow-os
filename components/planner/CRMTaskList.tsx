'use client'
import { useEffect, useState, useCallback } from 'react'
import { sb, fromSnake, type CRMTask } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import { RefreshCw } from 'lucide-react'

const priorityColor: Record<string, 'red' | 'amber' | 'slate'> = {
  High: 'red',
  Medium: 'amber',
  Low: 'slate',
}

export default function CRMTaskList() {
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">
          CRM Tasks
        </p>
        <button
          onClick={fetchTasks}
          className="text-[#8a8f9a] active:text-white transition-colors p-1"
          aria-label="Refresh CRM tasks"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="glass p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge label="DFG" color="blue" />
                <Badge label={t.priority} color={priorityColor[t.priority]} />
              </div>
              <p className="text-sm font-medium text-[#edeef2] truncate">{t.title}</p>
              {t.related && (
                <p className="text-[11px] text-[#8a8f9a] mt-0.5">{t.related}</p>
              )}
            </div>
            <p className="font-mono text-[10px] text-[#8a8f9a] whitespace-nowrap mt-0.5 flex-shrink-0">
              {t.due}
            </p>
          </div>
        ))}
        {!loading && tasks.length === 0 && (
          <p className="text-[#8a8f9a] text-sm text-center py-6">No open CRM tasks</p>
        )}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-3 h-16 animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
