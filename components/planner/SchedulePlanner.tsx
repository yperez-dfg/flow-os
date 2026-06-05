'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, X, ArrowRight, Check, RefreshCw } from 'lucide-react'
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
  task: '#1560FF',
  break: '#00d084',
  buffer: '#C7C7CC',
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmt12(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
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

  const { personalTasks } = usePlannerStore()
  const { addEvent, selectedDate } = useCalendarStore()

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
    if (adj) {
      setAdjusting(true)
    } else {
      setStep('generating')
    }

    const allTasks = [
      ...todayTasks.map((t) => `${t.title} [${t.priority}]`),
      ...extras,
    ]

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: allTasks,
          wakeTime,
          currentSchedule: adj ? schedule : undefined,
          adjustments: adj || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSchedule(data.schedule ?? [])
      setAiMessage(data.message ?? '')
      setStep('review')
    } catch (e) {
      setError('Could not generate schedule. Try again.')
      if (!adj) setStep('collect')
    } finally {
      setAdjusting(false)
      setAdjustment('')
    }
  }

  async function handleAdjust() {
    if (!adjustment.trim()) return
    await generate(adjustment.trim())
  }

  function lockIn() {
    const now = new Date()
    schedule.forEach((block) => {
      if (block.type === 'buffer') return
      addEvent({
        title: block.title,
        date: selectedDate,
        time: block.time,
        endTime: minutesToTime(timeToMinutes(block.time) + block.duration),
        notes: block.notes,
        color: TYPE_COLOR[block.type],
        repeat: 'none',
        notify: true,
        notifyMinutesBefore: 10,
        type: 'personal',
      })

      // Schedule local notification 10 min before
      const [bh, bm] = block.time.split(':').map(Number)
      const blockDate = new Date(selectedDate)
      blockDate.setHours(bh, bm - 10, 0, 0)
      const delay = blockDate.getTime() - now.getTime()
      if (delay > 0) {
        scheduleLocalNotification(
          `Coming up: ${block.title}`,
          `Starts in 10 minutes`,
          delay
        )
      }
    })
    setStep('locked')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1560FF] active:opacity-60 transition-opacity"
      >
        <Sparkles size={13} />
        Plan My Day
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Day Planner">
        <AnimatePresence mode="wait">

          {/* ── Step: collect ── */}
          {step === 'collect' && (
            <motion.div
              key="collect"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {/* Wake time */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                  Wake / Start Time
                </p>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                             text-[#1D1D1F] outline-none focus:border-[#1560FF]/50 text-sm"
                />
              </div>

              {/* Loaded tasks */}
              {todayTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                    Tasks Loaded ({todayTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {todayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 bg-[#F5F5F7] rounded-xl px-3 py-2"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            t.priority === 'High'
                              ? 'bg-[#ff4d6a]'
                              : t.priority === 'Medium'
                              ? 'bg-[#FF9F0A]'
                              : 'bg-[#C7C7CC]'
                          }`}
                        />
                        <p className="text-sm text-[#1D1D1F]">{t.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra tasks */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                  Anything Else Today?
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5
                               text-sm text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50"
                    placeholder="e.g. Gym, groceries, call mom..."
                    value={extraInput}
                    onChange={(e) => setExtraInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExtra()}
                  />
                  <button
                    onClick={addExtra}
                    className="w-10 h-10 rounded-xl bg-[#1560FF] text-white flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {extras.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extras.map((e, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 bg-[#1560FF]/10 text-[#1560FF] text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {e}
                        <button onClick={() => removeExtra(i)} className="active:opacity-60">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-[#ff4d6a] text-xs text-center">{error}</p>}

              <button
                onClick={() => generate()}
                disabled={todayTasks.length === 0 && extras.length === 0}
                className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl
                           active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Sparkles size={15} />
                Build My Schedule
              </button>
            </motion.div>
          )}

          {/* ── Step: generating ── */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              >
                <Sparkles size={28} className="text-[#1560FF]" />
              </motion.div>
              <p className="text-sm text-[#6E6E73]">Building your schedule…</p>
            </motion.div>
          )}

          {/* ── Step: review ── */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {aiMessage && (
                <p className="text-xs text-[#6E6E73] italic">{aiMessage}</p>
              )}

              {/* Schedule blocks */}
              <div className="space-y-2">
                {schedule.map((block, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-[#F5F5F7]"
                    style={{ borderLeft: `3px solid ${TYPE_COLOR[block.type]}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1D1D1F]">{block.title}</p>
                      {block.notes && (
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">{block.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-xs text-[#1D1D1F]">{fmt12(block.time)}</p>
                      <p className="font-mono text-[10px] text-[#6E6E73]">{block.duration}m</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjustment input */}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5
                             text-sm text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50"
                  placeholder="Move gym to 7am, add more breaks…"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdjust()}
                  disabled={adjusting}
                />
                <button
                  onClick={handleAdjust}
                  disabled={!adjustment.trim() || adjusting}
                  className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#1560FF]
                             flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                >
                  {adjusting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                </button>
              </div>

              <button
                onClick={lockIn}
                className="w-full bg-[#1D1D1F] text-white font-semibold py-3 rounded-xl
                           active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Check size={15} />
                Lock It In
              </button>
            </motion.div>
          )}

          {/* ── Step: locked ── */}
          {step === 'locked' && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#00d084]/15 flex items-center justify-center">
                <Check size={26} className="text-[#00d084]" />
              </div>
              <p className="font-semibold text-[#1D1D1F]">Schedule locked in</p>
              <p className="text-xs text-[#6E6E73]">
                {schedule.filter((b) => b.type !== 'buffer').length} events added to your calendar
                with reminders
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-2 text-[#1560FF] text-sm font-medium active:opacity-60"
              >
                Done
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </BottomSheet>
    </>
  )
}
