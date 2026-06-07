'use client'
import { usePlannerStore } from '@/store/planner'
import { X } from 'lucide-react'

const TYPE_COLOR = { task: '#1560FF', break: '#00d084', buffer: '#C7C7CC' }

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`
}

export default function DaySchedule() {
  const { lockedSchedule, clearLockedSchedule } = usePlannerStore()
  const today = new Date().toISOString().split('T')[0]

  if (!lockedSchedule || lockedSchedule.date !== today) return null

  const visible = lockedSchedule.blocks.filter((b) => b.type !== 'buffer')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Today&apos;s Schedule
          </p>
          <p className="text-[10px] text-[#AEAEB2] mt-0.5">{visible.length} blocks planned</p>
        </div>
        <button
          onClick={clearLockedSchedule}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#AEAEB2] active:text-[#ff4d6a] transition-colors"
          aria-label="Clear schedule"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {lockedSchedule.blocks.map((block, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E5E5EA]"
            style={{ borderLeft: `3px solid ${TYPE_COLOR[block.type]}` }}
          >
            <p className="font-mono text-xs font-semibold text-[#1D1D1F] whitespace-nowrap pt-0.5 w-16 flex-shrink-0">
              {fmt12(block.time)}
            </p>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${block.type === 'buffer' ? 'text-[#AEAEB2]' : 'text-[#1D1D1F]'}`}>
                {block.title}
              </p>
              {block.notes && (
                <p className="text-[11px] text-[#6E6E73] mt-0.5">{block.notes}</p>
              )}
            </div>
            <p className="font-mono text-[10px] text-[#AEAEB2] flex-shrink-0 pt-0.5">
              {block.duration}m
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
