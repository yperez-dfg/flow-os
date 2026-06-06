'use client'
import { useEffect, useState } from 'react'
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
  const [date, setDate] = useState(selectedDate)
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [notify, setNotify] = useState(true)

  // Sync date to whichever day is selected whenever the sheet opens
  useEffect(() => {
    if (open) {
      setDate(selectedDate)
      setTitle('')
      setTime('')
      setEndTime('')
      setNotes('')
      setColor(COLORS[0])
      setNotify(true)
    }
  }, [open, selectedDate])

  const handleAdd = () => {
    if (!title.trim()) return
    addEvent({
      title: title.trim(),
      date: date || selectedDate,
      time: time || undefined,
      endTime: endTime || undefined,
      notes: notes || undefined,
      color,
      repeat: 'none',
      notify,
      notifyMinutesBefore: 15,
      type: 'personal',
    })
    setTitle('')
    setTime('')
    setEndTime('')
    setNotes('')
    onClose()
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60
                    text-base transition-colors`

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Event">
      <div className="space-y-3">
        <input
          className={inputCls}
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          autoCorrect="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
        />

        <input
          type="date"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-[#6E6E73] font-mono uppercase tracking-wider mb-1.5 pl-1">Start</p>
            <input
              type="time"
              className={inputCls}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#6E6E73] font-mono uppercase tracking-wider mb-1.5 pl-1">End</p>
            <input
              type="time"
              className={inputCls}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <textarea
          className={`${inputCls} resize-none`}
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          enterKeyHint="done"
        />

        <div>
          <p className="text-[10px] text-[#6E6E73] font-mono uppercase tracking-wider mb-2 pl-1">Color</p>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full border-4 transition-all active:scale-90
                  ${color === c ? 'border-white scale-110 shadow-md' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setNotify(!notify)}
          className="w-full flex items-center justify-between py-3.5 px-4 bg-[#F5F5F7] rounded-2xl active:scale-[0.98] transition-transform"
        >
          <span className="text-sm text-[#1D1D1F]">Remind me (15 min before)</span>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${notify ? 'bg-[#1560FF]' : 'bg-[#C7C7CC]'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notify ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </button>

        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
        >
          Add Event
        </button>
      </div>
    </BottomSheet>
  )
}
