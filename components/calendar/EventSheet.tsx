'use client'
import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useCalendarStore } from '@/store/calendar'

const COLORS = ['#1560FF', '#00d084', '#ffb547', '#a855f7', '#ff4d6a', '#00d4ff']

interface EventSheetProps {
  open: boolean
  onClose: () => void
}

export default function EventSheet({ open, onClose }: EventSheetProps) {
  const { addEvent, selectedDate } = useCalendarStore()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [notify, setNotify] = useState(true)

  const handleAdd = () => {
    if (!title.trim()) return
    addEvent({
      title: title.trim(),
      date: selectedDate,
      time: time || undefined,
      notes: notes || undefined,
      color,
      repeat: 'none',
      notify,
      notifyMinutesBefore: 15,
      type: 'personal',
    })
    setTitle('')
    setTime('')
    setNotes('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Event">
      <div className="space-y-4">
        <input
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                     text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <input
          type="time"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                     text-[#edeef2] outline-none focus:border-[#1560FF]/50"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                     text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50 resize-none"
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div>
          <p className="text-xs text-[#8a8f9a] mb-2">Color</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all
                  ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setNotify(!notify)}
            className={`w-10 h-6 rounded-full transition-colors relative
              ${notify ? 'bg-[#1560FF]' : 'bg-white/[0.12]'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                ${notify ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-sm text-[#edeef2]">Remind me (15 min before)</span>
        </label>
        <button
          onClick={handleAdd}
          className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
        >
          Add Event
        </button>
      </div>
    </BottomSheet>
  )
}
