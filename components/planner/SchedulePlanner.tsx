'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, X, Check, RefreshCw, CalendarDays, Pencil } from 'lucide-react'
import BottomSheet from '@/components/ui/BottomSheet'
import { usePlannerStore } from '@/store/planner'
import { useCalendarStore } from '@/store/calendar'
import { scheduleLocalNotification } from '@/lib/notifications'

interface ScheduleBlock {
  time: string
  title: string
  duration: number
  notes?: string
  type: 'task' | 'break' | 'buffer'
}

type Step = 'collect' | 'generating' | 'review' | 'locked'

const TYPE_COLOR: Record<ScheduleBlock['type'], string> = {
  task:   '#1560FF',
  break:  '#00d084',
  buffer: '#C7C7CC',
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`
}

function toICSDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')
}

function generateICS(blocks: ScheduleBlock[], date: string): string {
  const events = blocks
    .filter((b) => b.type !== 'buffer')
    .map((b, i) => {
      const start = new Date(`${date}T${b.time}:00`)
      const end = new Date(start.getTime() + b.duration * 60000)
      return [
        'BEGIN:VEVENT',
        `UID:flowos-${date}-${i}@flowos`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${b.title}`,
        b.notes ? `DESCRIPTION:${b.notes}` : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${b.title} starts in 10 min`,
        'END:VALARM',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlowOS//Daily Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function SchedulePlanner() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('collect')
  const [extras, setExtras] = useState<string[]>([])
  const [extraInput, setExtraInput] = useState('')
  const [wakeTime, setWakeTime] = useState('08:00')
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([])
  const [aiMessage, setAiMessage] = useState('')
  const [adjustment, setAdjustment] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [error, setError] = useState('')
  const [icsUrl, setIcsUrl] = useState('')

  const { personalTasks, addTask, setLockedSchedule } = usePlannerStore()
  const { addEvent, deleteEvent, selectedDate, events: calendarEvents } = useCalendarStore()

  const todayTasks = personalTasks.filter((t) => !t.done)

  function handleOpen() {
    setStep('collect')
    setExtras([])
    setExtraInput('')
    setWakeTime('08:00')
    setSchedule([])
    setAiMessage('')
    setAdjustment('')
    setError('')
    setIcsUrl('')
    setOpen(true)
  }

  function addExtra() {
    const v = extraInput.trim()
    if (!v) return
    setExtras((e) => [...e, v])
    setExtraInput('')
  }

  function removeExtra(i: number) {
    setExtras((e) => e.filter((_, idx) => idx !== i))
  }

  async function generate(adj?: string) {
    setError('')
    adj ? setAdjusting(true) : setStep('generating')

    const allTasks = [
      ...todayTasks.map((t) => `${t.title} [${t.priority}]`),
      ...extras,
    ]

    const existingEvents = calendarEvents
      .filter(e => e.date === selectedDate && e.time)
      .map(e => ({ title: e.title, time: e.time!, duration: 60 }))

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: allTasks,
          wakeTime,
          currentSchedule: adj ? schedule : undefined,
          adjustments: adj || undefined,
          existingEvents: existingEvents.length > 0 ? existingEvents : undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSchedule(data.schedule ?? [])
      setAiMessage(data.message ?? '')
      setStep('review')
    } catch {
      setError('Could not generate schedule. Try again.')
      if (!adj) setStep('collect')
    } finally {
      setAdjusting(false)
      setAdjustment('')
    }
  }

  function lockIn() {
    const now = new Date()

    // Clear any existing personal events for this date to prevent duplicates
    calendarEvents
      .filter((e) => e.date === selectedDate && e.type === 'personal')
      .forEach((e) => deleteEvent(e.id))

    schedule.forEach((block) => {
      if (block.type === 'buffer') return

      if (block.type === 'task') {
        if (!personalTasks.some(t => t.title === block.title)) {
          addTask({
            title: block.title,
            done: false,
            priority: 'Medium',
            repeat: 'none',
            due: selectedDate,
          })
        }
      }

      addEvent({
        title: block.title,
        date: selectedDate,
        time: block.time,
        endTime: minutesToTime(
          block.time.split(':').reduce((h, m, i) => h + (i === 0 ? +m * 60 : +m), 0) + block.duration
        ),
        notes: block.notes,
        color: TYPE_COLOR[block.type],
        repeat: 'none',
        notify: true,
        notifyMinutesBefore: 10,
        type: 'personal',
      })

      const [bh, bm] = block.time.split(':').map(Number)
      const blockDate = new Date(selectedDate + 'T00:00:00')
      blockDate.setHours(bh, Math.max(0, bm - 10), 0, 0)
      const delay = blockDate.getTime() - now.getTime()
      if (delay > 0) {
        scheduleLocalNotification(`Coming up: ${block.title}`, 'Starts in 10 minutes', delay)
      }
    })

    setLockedSchedule(schedule, selectedDate)

    const ics = generateICS(schedule, selectedDate)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    setIcsUrl(url)
    setStep('locked')
  }

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

  // Footer changes per step — always pinned, always visible
  const footer = (() => {
    if (step === 'collect') {
      return (
        <button
          onClick={() => generate()}
          disabled={todayTasks.length === 0 && extras.length === 0}
          className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 text-base"
        >
          <Sparkles size={16} /> Build My Schedule
        </button>
      )
    }
    if (step === 'review') {
      return (
        <button
          onClick={lockIn}
          className="w-full bg-[#1D1D1F] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-base"
        >
          <Check size={16} /> Approve & Lock In
        </button>
      )
    }
    if (step === 'locked') {
      return (
        <button
          onClick={() => setOpen(false)}
          className="w-full bg-[#F5F5F7] text-[#1560FF] font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
        >
          Done
        </button>
      )
    }
    return null
  })()

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1560FF]/10 text-[#1560FF] text-xs font-semibold active:scale-90 transition-transform"
      >
        <Sparkles size={12} />
        Plan My Day
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Day Planner" footer={footer}>
        <AnimatePresence mode="wait">

          {/* ── collect ── */}
          {step === 'collect' && (
            <motion.div key="collect" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Wake / Start Time</p>
                <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className={inputCls} />
              </div>

              {todayTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                    Your Tasks ({todayTasks.length} loaded)
                  </p>
                  <div className="space-y-1.5">
                    {todayTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2.5 bg-[#F5F5F7] rounded-xl px-3 py-3">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'High' ? 'bg-[#ff4d6a]' : t.priority === 'Medium' ? 'bg-[#FF9F0A]' : 'bg-[#C7C7CC]'}`} />
                        <p className="text-sm text-[#1D1D1F]">{t.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Add More</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4 text-base text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60"
                    placeholder="Gym, groceries, call mom…"
                    value={extraInput}
                    onChange={(e) => setExtraInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExtra()}
                    enterKeyHint="done"
                    autoCapitalize="sentences"
                  />
                  <button onClick={addExtra} className="w-14 h-[56px] rounded-2xl bg-[#1560FF] text-white flex items-center justify-center active:scale-90 transition-transform">
                    <Plus size={18} />
                  </button>
                </div>
                {extras.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extras.map((e, i) => (
                      <span key={i} className="flex items-center gap-1 bg-[#1560FF]/10 text-[#1560FF] text-xs font-medium px-3 py-2 rounded-full">
                        {e}
                        <button onClick={() => removeExtra(i)} className="active:opacity-60"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-[#ff4d6a] text-xs text-center">{error}</p>}
            </motion.div>
          )}

          {/* ── generating ── */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                <Sparkles size={30} className="text-[#1560FF]" />
              </motion.div>
              <p className="text-sm text-[#6E6E73]">Building your schedule…</p>
            </motion.div>
          )}

          {/* ── review ── */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {aiMessage && <p className="text-xs text-[#6E6E73] italic px-1">{aiMessage}</p>}

              <div className="space-y-2">
                {schedule.map((block, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F5F5F7]" style={{ borderLeft: `3px solid ${TYPE_COLOR[block.type]}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1D1D1F]">{block.title}</p>
                      {block.notes && <p className="text-[11px] text-[#6E6E73] mt-0.5">{block.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-xs font-semibold text-[#1D1D1F]">{fmt12(block.time)}</p>
                      <p className="font-mono text-[10px] text-[#6E6E73]">{block.duration}m</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjust request */}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60"
                  placeholder="Move gym to 7am, add more breaks…"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && adjustment.trim() && generate(adjustment.trim())}
                  disabled={adjusting}
                  enterKeyHint="send"
                />
                <button
                  onClick={() => generate(adjustment.trim())}
                  disabled={!adjustment.trim() || adjusting}
                  className="w-14 h-[56px] rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#1560FF] flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                >
                  {adjusting ? <RefreshCw size={15} className="animate-spin" /> : <Pencil size={15} />}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── locked ── */}
          {step === 'locked' && (
            <motion.div key="locked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00d084]/15 flex items-center justify-center">
                <Check size={28} className="text-[#00d084]" />
              </div>
              <div>
                <p className="font-semibold text-[#1D1D1F] text-lg">Schedule locked in!</p>
                <p className="text-xs text-[#6E6E73] mt-1">
                  {schedule.filter((b) => b.type === 'task').length} tasks · {schedule.filter((b) => b.type !== 'buffer').length} calendar events · reminders set
                </p>
              </div>

              {icsUrl && (
                <a
                  href={icsUrl}
                  download={`flowos-${selectedDate}.ics`}
                  className="flex items-center gap-2 px-5 py-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-sm font-medium text-[#1D1D1F] active:scale-95 transition-transform"
                >
                  <CalendarDays size={16} className="text-[#1560FF]" />
                  Add to iOS Calendar
                </a>
              )}
              <p className="text-[10px] text-[#AEAEB2]">Tap above to import into Apple Calendar with alarms</p>
            </motion.div>
          )}

        </AnimatePresence>
      </BottomSheet>
    </>
  )
}
