# FlowOS Phase 3 — Bug Fixes & New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the lockIn() duplicate-events bug and implement 7 user-requested features: delete calendar events, iOS Calendar export on Calendar page, planner task grouping (remove Today/All toggle), weekly missed-task review section, month-view past-day coloring, AI future-date task scheduling, and a "push to iOS Calendar" button on the Calendar page.

**Architecture:** All data routes through Supabase (personal tasks) or Zustand persist (calendar events, budget). The planner store has NO persist middleware — it loads via `hydrate()` on page mount. The calendar store uses Zustand persist with localStorage. No new Supabase tables needed — use existing `personal_tasks` for day-coloring logic and missed-task review.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Framer Motion, Zustand, Supabase, Groq Llama-3.3-70b-versatile, nanoid, lucide-react.

---

## File Map

| File | Change |
|---|---|
| `components/planner/SchedulePlanner.tsx` | Fix lockIn() — clear old events for date before adding new batch |
| `components/calendar/DayView.tsx` | Add delete button to each event card |
| `app/(app)/calendar/page.tsx` | Add iOS Calendar export button (ICS download for all events) |
| `lib/ics-utils.ts` | New — shared ICS generation moved here from SchedulePlanner |
| `components/planner/PersonalTaskList.tsx` | Replace Today/All with grouped sections: Overdue / Today / Upcoming / No Date |
| `app/(app)/planner/page.tsx` | Remove Today/All toggle state; add WeeklyReview at bottom |
| `components/planner/WeeklyReview.tsx` | New — shows tasks due in past 7 days that are not done |
| `components/calendar/MonthView.tsx` | Color past-day cells green/yellow/red by task completion; hydrate planner store |
| `app/api/ai-chat/route.ts` | Add `due` field to task type; parse natural date phrases |
| `components/home/AIChatInput.tsx` | Pass `due` when calling `addTask` from AI response |

---

### Task 1: Extract ICS utility + fix lockIn() duplicates

**Root cause:** `lockIn()` calls `addEvent()` for every schedule block with no deduplication check. Each press of "Approve & Lock In" stacks another copy of every block onto the calendar. Also `setOpen(false)` is never called — the UI transitions to a 'locked' step that shows a success screen, but the user doesn't see the "Done" button because the sheet doesn't scroll. Fix: (a) wipe all `type:'personal'` events for `selectedDate` before adding new ones, (b) call `setOpen(false)` directly from `lockIn()` and skip the intermediate locked step.

**Files:**
- Create: `lib/ics-utils.ts`
- Modify: `components/planner/SchedulePlanner.tsx`

- [ ] **Step 1: Create `lib/ics-utils.ts`** — move ICS logic out of SchedulePlanner

```typescript
// lib/ics-utils.ts

export interface ICSBlock {
  time: string      // "HH:MM"
  title: string
  duration: number  // minutes
  notes?: string
  type: 'task' | 'break' | 'buffer'
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')
}

export function generateICS(blocks: ICSBlock[], date: string): string {
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

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Update `components/planner/SchedulePlanner.tsx`**

Replace the import of `generateICS` local function with the shared utility, fix `lockIn()` to clear old events first, close the sheet immediately after locking (skip the 'locked' step — instead show a toast-style state change):

At the top, add:
```typescript
import { generateICS, downloadICS } from '@/lib/ics-utils'
```

Remove the local `toICSDate` and `generateICS` functions (lines ~38-74).

Replace the `lockIn()` function (lines ~157-206) with:
```typescript
function lockIn() {
  // 1. Clear any existing personal events for this date to prevent duplicates
  const existingForDate = calendarEvents.filter(
    (e) => e.date === selectedDate && e.type === 'personal'
  )
  existingForDate.forEach((e) => deleteEvent(e.id))

  const now = new Date()
  schedule.forEach((block) => {
    if (block.type === 'buffer') return

    if (block.type === 'task') {
      if (!personalTasks.some((t) => t.title === block.title)) {
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

  // 2. Download ICS and close sheet immediately
  const ics = generateICS(schedule, selectedDate)
  downloadICS(ics, `flowos-${selectedDate}.ics`)
  setOpen(false)
}
```

Add `deleteEvent` to the destructure from `useCalendarStore`:
```typescript
const { addEvent, deleteEvent, selectedDate, events: calendarEvents } = useCalendarStore()
```

Remove the `icsUrl` state and `setIcsUrl` since the ICS downloads immediately. Remove the `step === 'locked'` JSX block. Remove the `locked` type from the `Step` type union:
```typescript
type Step = 'collect' | 'generating' | 'review'
```

Remove the `locked` case from the `footer` IIFE.

- [ ] **Step 3: Verify — open Day Planner, generate a schedule, click "Approve & Lock In"**

Expected: sheet closes immediately, ICS file downloads, calendar shows events for that date. Opening the planner again and locking in again should replace (not duplicate) the events.

- [ ] **Step 4: Commit**
```bash
git add lib/ics-utils.ts components/planner/SchedulePlanner.tsx
git commit -m "fix: lockIn() clears old events before re-locking; download ICS immediately"
```

---

### Task 2: Delete calendar events from DayView

**Files:**
- Modify: `components/calendar/DayView.tsx`

- [ ] **Step 1: Add delete button to each event card**

Replace the full content of `components/calendar/DayView.tsx` with:

```typescript
'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'
import Badge from '@/components/ui/Badge'
import { Trash2 } from 'lucide-react'

export default function DayView() {
  const { selectedDate, events, deleteEvent } = useCalendarStore()
  const dayEvents = expandEvents(events, selectedDate, selectedDate)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div className="space-y-2 mt-4">
      {dayEvents.length === 0 && (
        <p className="text-[#6E6E73] text-sm text-center py-8">
          No events on this day
        </p>
      )}
      {dayEvents.map((e) => (
        <div
          key={e.id}
          className="apple-card p-3 flex items-start gap-3"
          style={{ borderLeft: `3px solid ${e.color}` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-medium text-[#1D1D1F]">{e.title}</p>
              {e.type === 'crm_meeting' && <Badge label="DFG" color="blue" />}
            </div>
            {e.notes && (
              <p className="text-[11px] text-[#6E6E73]">{e.notes}</p>
            )}
          </div>
          {e.time && (
            <p className="font-mono text-xs text-[#6E6E73] whitespace-nowrap flex-shrink-0">
              {e.time}
            </p>
          )}
          <button
            onClick={() => deleteEvent(e.id)}
            className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-1 flex-shrink-0 -mr-1"
            aria-label="Delete event"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify** — navigate to Calendar, tap a date with events, confirm trash icon appears. Tap it, event disappears immediately.

- [ ] **Step 3: Commit**
```bash
git add components/calendar/DayView.tsx
git commit -m "feat: add delete button to calendar DayView event cards"
```

---

### Task 3: iOS Calendar export button on Calendar page

This gives users a one-tap way to export ALL their upcoming FlowOS calendar events as a single `.ics` file they can import into Apple Calendar / Google Calendar — no need to lock in a schedule first.

**Files:**
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Update `app/(app)/calendar/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { useCalendarStore } from '@/store/calendar'
import { generateICS, downloadICS } from '@/lib/ics-utils'
import { Plus, CalendarDays } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { view, events } = useCalendarStore()

  function exportAllToIOS() {
    const today = new Date().toISOString().split('T')[0]
    // Export events from 30 days ago to 90 days ahead
    const from = new Date()
    from.setDate(from.getDate() - 30)
    const to = new Date()
    to.setDate(to.getDate() + 90)
    const fromISO = from.toISOString().split('T')[0]
    const toISO = to.toISOString().split('T')[0]

    // Build ICS blocks from calendar events (only those with a time)
    const blocks = events
      .filter((e) => e.time && e.date >= fromISO && e.date <= toISO)
      .map((e) => ({
        time: e.time!,
        title: e.title,
        duration: e.endTime
          ? (() => {
              const [sh, sm] = e.time!.split(':').map(Number)
              const [eh, em] = e.endTime.split(':').map(Number)
              return Math.max(15, (eh * 60 + em) - (sh * 60 + sm))
            })()
          : 60,
        notes: e.notes,
        type: 'task' as const,
        date: e.date,
      }))

    if (blocks.length === 0) {
      alert('No events with a time to export. Add events with a start time first.')
      return
    }

    // Generate one ICS with all events by calling generateICS per unique date
    const uniqueDates = [...new Set(blocks.map((b) => b.date))]
    const allSections: string[] = []
    uniqueDates.forEach((date) => {
      const dateBlocks = blocks.filter((b) => b.date === date)
      const ics = generateICS(dateBlocks, date)
      // Extract VEVENT sections only
      const matches = ics.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? []
      allSections.push(...matches)
    })

    const fullICS = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FlowOS//All Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...allSections,
      'END:VCALENDAR',
    ].join('\r\n')

    downloadICS(fullICS, `flowos-calendar-${today}.ics`)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAllToIOS}
            className="flex items-center gap-1 text-[#1560FF] text-xs font-semibold px-3 py-2 rounded-full bg-[#1560FF]/10 active:scale-90 transition-transform"
            aria-label="Export to iOS Calendar"
          >
            <CalendarDays size={14} />
            <span>iOS</span>
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="text-[#1560FF] active:scale-90 transition-transform"
            aria-label="Add event"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>
      <CalendarHeader />
      {view === 'week' && <WeekView />}
      {view === 'month' && (
        <>
          <MonthView />
          <DayView />
        </>
      )}
      {view === 'day' && <DayView />}
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify** — open Calendar, tap "iOS" button. If there are events with times, a `.ics` file downloads. On iPhone, opening the file imports all events into Apple Calendar.

- [ ] **Step 3: Commit**
```bash
git add app/\(app\)/calendar/page.tsx
git commit -m "feat: add iOS Calendar export button to Calendar page"
```

---

### Task 4: Planner task grouping — remove Today/All, group by status

**Goal:** Remove the Today/All toggle entirely. Instead, show tasks in 4 labeled groups: **Overdue** (red), **Due Today**, **Upcoming**, **No Due Date**. Completed tasks move to a collapsed "Done" group at the bottom. This makes overdue tasks impossible to miss and gives a natural weekly view without the toggle.

**Files:**
- Modify: `app/(app)/planner/page.tsx`
- Modify: `components/planner/PersonalTaskList.tsx`

- [ ] **Step 1: Update `app/(app)/planner/page.tsx`** — remove toggle state

```typescript
'use client'
import { useEffect } from 'react'
import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import Routines from '@/components/planner/Routines'
import WeeklyGoals from '@/components/planner/WeeklyGoals'
import LongTermGoals from '@/components/planner/LongTermGoals'
import SchedulePlanner from '@/components/planner/SchedulePlanner'
import WeeklyReview from '@/components/planner/WeeklyReview'
import { usePlannerStore } from '@/store/planner'

export default function PlannerPage() {
  const { resetDailyTasksIfNeeded, hydrate } = usePlannerStore()

  useEffect(() => {
    hydrate().then(() => resetDailyTasksIfNeeded())
  }, [hydrate, resetDailyTasksIfNeeded])

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Planner</h1>
        <SchedulePlanner />
      </div>

      <CRMTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <PersonalTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <Routines />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <WeeklyGoals />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <LongTermGoals />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <WeeklyReview />
    </div>
  )
}
```

- [ ] **Step 2: Update `CRMTaskList` call** — remove `todayOnly` prop (it no longer receives it). In `components/planner/CRMTaskList.tsx`, change the component signature:

Current: `export default function CRMTaskList({ todayOnly = false }: { todayOnly?: boolean })`
New: `export default function CRMTaskList()`

Remove the `todayOnly` filtering from `fetchTasks` — always show all open CRM tasks:
```typescript
const fetchTasks = useCallback(async () => {
  setLoading(true)
  let query = sb.from('tasks').select('*').eq('done', false).order('due', { ascending: true })
  const { data } = await query
  setTasks((data ?? []).map((r) => fromSnake<CRMTask>(r)))
  setLoading(false)
}, [])
```

- [ ] **Step 3: Rewrite `components/planner/PersonalTaskList.tsx`** — remove `todayOnly` prop, add grouping

```typescript
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

  const overdue = personalTasks.filter((t) => !t.done && t.due && t.due < today)
  const dueToday = personalTasks.filter((t) => !t.done && t.due === today)
  const upcoming = personalTasks.filter((t) => !t.done && t.due && t.due > today)
  const noDate = personalTasks.filter((t) => !t.done && !t.due)
  const done = personalTasks.filter((t) => t.done)

  const inputCls = `w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                    text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base`

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

  function Group({ label, tasks, accent }: { label: string; tasks: typeof personalTasks; accent?: string }) {
    if (tasks.length === 0) return null
    return (
      <div className="space-y-2">
        <p className={`text-[10px] font-mono uppercase tracking-widest ${accent ?? 'text-[#6E6E73]'}`}>
          {label} · {tasks.length}
        </p>
        <AnimatePresence>
          {tasks.map((t) => <TaskCard key={t.id} t={t} />)}
        </AnimatePresence>
      </div>
    )
  }

  const isEmpty = overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && noDate.length === 0

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
              <ChevronDown size={12} className={`transition-transform ${showDone ? 'rotate-180' : ''}`} />
              Done · {done.length}
            </button>
            <AnimatePresence>
              {showDone && done.map((t) => <TaskCard key={t.id} t={t} />)}
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
```

- [ ] **Step 4: Verify** — open Planner. Tasks appear in grouped sections. Overdue tasks show red. Done tasks are collapsed under a "Done" toggle. No Today/All buttons anywhere.

- [ ] **Step 5: Commit**
```bash
git add app/\(app\)/planner/page.tsx components/planner/PersonalTaskList.tsx components/planner/CRMTaskList.tsx
git commit -m "feat: replace Today/All toggle with grouped task sections (Overdue/Today/Upcoming)"
```

---

### Task 5: Weekly Review component — missed tasks

**Goal:** Show tasks that were due in the past 7 days but are still not done. This is the "end-of-week review" — see what slipped and decide what to carry forward.

**Files:**
- Create: `components/planner/WeeklyReview.tsx`

- [ ] **Step 1: Create `components/planner/WeeklyReview.tsx`**

```typescript
'use client'
import { usePlannerStore } from '@/store/planner'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'

export default function WeeklyReview() {
  const { personalTasks, toggleTask, deleteTask } = usePlannerStore()
  const [open, setOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weekAgo = sevenDaysAgo.toISOString().split('T')[0]

  // Tasks that were due in the past 7 days and are still not done
  const missed = personalTasks.filter(
    (t) => !t.done && t.due && t.due >= weekAgo && t.due < today
  )

  if (missed.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-[#FF9F0A]" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF9F0A]">
            Weekly Review · {missed.length} missed
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#AEAEB2] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            <p className="text-xs text-[#6E6E73] mb-3">
              These tasks were due in the past 7 days. Mark done, reschedule, or delete.
            </p>
            {missed.map((t) => (
              <div key={t.id} className="apple-card px-4 py-3 flex items-center gap-3 border-l-2 border-[#FF9F0A]">
                <button
                  onClick={() => toggleTask(t.id)}
                  className="w-6 h-6 rounded-full border-2 border-[#C7C7CC] flex-shrink-0 flex items-center justify-center active:bg-[#00d084] active:border-[#00d084] transition-colors"
                >
                  <span className="text-transparent text-[10px]">✓</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1D1D1F]">{t.title}</p>
                  <p className="text-[10px] font-mono text-[#ff4d6a] mt-0.5">Due {t.due}</p>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-1 text-xs font-mono"
                  aria-label="Remove from review"
                >
                  ×
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Note: `WeeklyReview` is already imported and placed at the bottom of `app/(app)/planner/page.tsx` from Task 4.

- [ ] **Step 2: Verify** — create a personal task with a due date of yesterday (or any past date), keep it undone. Reload the Planner page. The "Weekly Review · N missed" section appears at the bottom. Clicking it expands to show the overdue task. Marking it done removes it from the review.

- [ ] **Step 3: Commit**
```bash
git add components/planner/WeeklyReview.tsx
git commit -m "feat: add Weekly Review section showing tasks missed in the past 7 days"
```

---

### Task 6: Month view past-day coloring

**Goal:** Past day cells in the month calendar are colored green (all tasks done), yellow (some done), or red (no tasks done) if any personal tasks were due that day. Today and future days are unchanged.

**Files:**
- Modify: `components/calendar/MonthView.tsx`
- Modify: `app/(app)/calendar/page.tsx` — add planner hydrate call

- [ ] **Step 1: Add planner hydration to Calendar page**

In `app/(app)/calendar/page.tsx`, add at the top:
```typescript
import { useEffect } from 'react'
import { usePlannerStore } from '@/store/planner'
```

Inside `CalendarPage()`, before the return:
```typescript
const { hydrate: hydratePlanner, personalTasks } = usePlannerStore()
useEffect(() => { hydratePlanner() }, [hydratePlanner])
```

Pass `personalTasks` to `MonthView` (or use the store directly inside MonthView — simpler).

Actually, since `usePlannerStore` is a Zustand store, `MonthView` can read it directly. Just call `hydratePlanner()` in the calendar page once on mount so the data is available.

- [ ] **Step 2: Update `components/calendar/MonthView.tsx`**

```typescript
'use client'
import { useCalendarStore } from '@/store/calendar'
import { usePlannerStore } from '@/store/planner'
import { expandEvents } from '@/lib/calendar-utils'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const { personalTasks } = usePlannerStore()

  const date = new Date(selectedDate + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Expand recurring events for the visible month range
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const expanded = expandEvents(events, firstOfMonth, lastOfMonth)
  const eventDates = new Set(expanded.map((e) => e.date))

  // Build a map: date → { total, done } for past-day coloring
  const tasksByDate: Record<string, { total: number; done: number }> = {}
  personalTasks.forEach((t) => {
    if (!t.due) return
    if (!tasksByDate[t.due]) tasksByDate[t.due] = { total: 0, done: 0 }
    tasksByDate[t.due].total++
    if (t.done) tasksByDate[t.due].done++
  })

  function pastDayColor(iso: string): string | null {
    if (iso >= today) return null
    const stats = tasksByDate[iso]
    if (!stats || stats.total === 0) return null
    const ratio = stats.done / stats.total
    if (ratio >= 1) return 'bg-[#00d084]/20 text-[#00d084]'    // all done — green
    if (ratio >= 0.5) return 'bg-[#FF9F0A]/20 text-[#FF9F0A]'  // some done — yellow
    return 'bg-[#ff4d6a]/20 text-[#ff4d6a]'                    // none done — red
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-mono text-[#6E6E73] py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = iso === today
          const isSelected = iso === selectedDate
          const hasEvent = eventDates.has(iso)
          const colorClass = (!isSelected && !isToday) ? pastDayColor(iso) : null

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-[#1560FF] text-white'
                  : isToday
                  ? 'bg-[#1560FF]/20 text-[#1560FF]'
                  : colorClass
                  ? colorClass
                  : 'text-[#1D1D1F] active:bg-[#E5E5EA]'
                }`}
            >
              {day}
              {hasEvent && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-[#00d4ff]'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify** — add a personal task with due date = yesterday, mark it done. Switch to Calendar → Month view. Yesterday's cell should be green. Add another task for 2 days ago, leave it undone — that cell should be red.

- [ ] **Step 4: Commit**
```bash
git add components/calendar/MonthView.tsx app/\(app\)/calendar/page.tsx
git commit -m "feat: color past days in month view green/yellow/red by task completion"
```

---

### Task 7: AI chat future-date task scheduling

**Goal:** When the user types "add task X for tomorrow" or "remind me Friday to call John", the AI returns a `due` date in the task response. `AIChatInput` passes that due date to `addTask`.

**Files:**
- Modify: `app/api/ai-chat/route.ts`
- Modify: `components/home/AIChatInput.tsx`

- [ ] **Step 1: Update system prompt in `app/api/ai-chat/route.ts`**

In `buildSystem()`, replace the Task shape:
```
Task:
{ "type": "task", "data": { "title": "...", "priority": "High|Medium|Low", "done": false, "repeat": "none", "due": "YYYY-MM-DD or empty string" } }
```

Add to the Rules section (after the TODAY rule):
```
- "add task X for tomorrow" → task, due: tomorrow's date (TODAY + 1 day)
- "add task X for Friday" / "for next Monday" → task, due: nearest upcoming weekday YYYY-MM-DD
- "add task X" with no date → task, due: ""
- Always parse relative dates: "tomorrow", "next week", "Monday", "June 15", "in 3 days"
- Convert all dates to YYYY-MM-DD format
```

The full updated `buildSystem` function in `app/api/ai-chat/route.ts`:

```typescript
function buildSystem(today: string) {
  return `You are FlowOS, a smart personal assistant embedded in a productivity app.
The user types natural-language commands. Parse the intent and return ONLY valid JSON — no markdown, no code fences, no explanation.

Use EXACTLY one of these shapes:

Task:
{ "type": "task", "data": { "title": "...", "priority": "High|Medium|Low", "done": false, "repeat": "none", "due": "YYYY-MM-DD or empty string" } }

Reminder / Calendar event:
{ "type": "reminder", "data": { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "color": "#1560FF", "repeat": "none|daily|weekly|monthly", "notify": true, "notifyMinutesBefore": 15, "type": "personal" } }

One-time expense / transaction:
{ "type": "expense", "data": { "amount": <number>, "category": "Rent|Food|Gas|Subscriptions|Misc", "note": "...", "date": "YYYY-MM-DD", "type": "expense" } }

Recurring monthly bill (rent, subscriptions, etc):
{ "type": "recurring_expense", "items": [ { "name": "...", "amount": <number>, "category": "Rent|Food|Gas|Subscriptions|Misc", "dueDay": <1-28> } ] }

Weekly goal:
{ "type": "goal", "data": { "title": "...", "target": <number>, "unit": "...", "current": 0, "weekOf": "${today}" } }

Meal / food log:
{ "type": "meal", "data": { "name": "...", "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "time": "HH:MM" } }

CRM activity note (call, email, meeting, SMS, general note):
{ "type": "crm_note", "data": { "related": "...", "content": "...", "activityType": "call|email|meeting|note|sms" } }

New CRM lead:
{ "type": "crm_lead", "data": { "name": "...", "business": "...", "phone": "...", "source": "...", "service": "Full Stack|Growth|Foundation", "value": <number> } }

Unknown / unclear:
{ "type": "unknown", "message": "Short friendly tip on what to try" }

Rules:
- TODAY is ${today}. Use 24-hour HH:MM times.
- "add task X for tomorrow" → task, due: next day from TODAY in YYYY-MM-DD
- "add task X for Friday" / "for next Monday" → task, due: nearest upcoming weekday in YYYY-MM-DD
- "add task X for June 15" → task, due: YYYY-06-15
- "add task X in 3 days" → task, due: TODAY + 3 days in YYYY-MM-DD
- "add task X" with no date → task, due: ""
- Always resolve relative date words to absolute YYYY-MM-DD
- "Rent $1500 due on the 2nd" → recurring_expense, dueDay: 2, category: "Rent"
- "Add rent $1500 every month on the 2nd" → same
- "I spent $40 on food" → expense (one-time)
- "remind me to..." → reminder
- "add a task to..." → task
- "I ate a burger 600 calories" → meal
- "Called John at Marcus LLC, left voicemail" → crm_note, activityType: "call"
- "New lead: Sarah from Bloom Bakery, wants website, $2500" → crm_lead
- "Emailed proposal to Marcus" → crm_note, activityType: "email"
- Multiple recurring bills in one message → multiple items in the items array
- Infer category from context: rent/mortgage → "Rent", netflix/spotify/gym → "Subscriptions", uber/gas → "Gas"
- If truly unclear, return unknown`
}
```

- [ ] **Step 2: Update `components/home/AIChatInput.tsx`** — pass `due` from task response

Find the `case 'task':` handler (around line 77):

Current:
```typescript
case 'task':
  addTask(result.data)
  showToast(`✓ Task added: ${result.data.title}`)
  break
```

Replace with:
```typescript
case 'task':
  addTask({
    title: result.data.title,
    priority: result.data.priority ?? 'Medium',
    done: false,
    repeat: 'none',
    due: result.data.due || undefined,
  })
  showToast(`✓ Task added: ${result.data.title}${result.data.due ? ` · due ${result.data.due}` : ''}`)
  break
```

- [ ] **Step 3: Verify** — type "add task call the dentist for tomorrow" in the AI chat on the home page. Confirm a task is added in the Planner with tomorrow's date in the Upcoming group. Type "add task review contracts for next Monday". Confirm due date is next Monday.

- [ ] **Step 4: Commit**
```bash
git add app/api/ai-chat/route.ts components/home/AIChatInput.tsx
git commit -m "feat: AI chat now parses future dates for task due dates"
```

---

## Self-Review

**1. Spec coverage check:**
- ✅ lockIn() duplicates → Task 1 (clear events before re-locking)
- ✅ Approve & Lock In button behavior → Task 1 (download ICS immediately, close sheet)
- ✅ Delete calendar events → Task 2
- ✅ iOS Calendar push button on Calendar page → Task 3
- ✅ Remove Today/All toggle, grouped task view → Task 4
- ✅ Missed tasks / weekly review → Task 5
- ✅ Month view day coloring → Task 6
- ✅ AI future-date task scheduling → Task 7
- ✅ View tasks for previous/future days → Tasks 4 (grouped by date, any date visible) + Task 2 (DayView for any selected date already works)

**2. Placeholder scan:** None found. All code blocks are complete.

**3. Type consistency:**
- `ICSBlock` defined in `lib/ics-utils.ts`, used in `SchedulePlanner.tsx` and `calendar/page.tsx` — consistent
- `personalTasks` type is `PersonalTask[]` from `store/planner` — used consistently in Tasks 4, 5, 6
- `deleteEvent(id: string)` is an existing action in `useCalendarStore` — used in Tasks 1 and 2 ✅
- `due: string | undefined` on PersonalTask — already defined in store, Task 7 passes `undefined` for no-date tasks ✅
