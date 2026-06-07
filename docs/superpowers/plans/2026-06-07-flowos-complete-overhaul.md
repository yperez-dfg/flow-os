# FlowOS Complete Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all daily-use bugs, add Morning Brief AI, Week View, Today filter, and 3 AI coaching features across 27 sequential tasks.

**Architecture:** Four phases ordered by daily impact. Each task is independently committable. Phase 4 exercise log changes (Task 26) replace the `done` field mutation introduced in Phase 2 (Task 10) — if running in one session, apply Task 10 and Task 26 together.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · Zustand (persist) · Framer Motion · Groq Llama 3.3 70B (`llama-3.3-70b-versatile`) · Supabase · Serwist PWA · Jest (node env, `__tests__/**/*.test.ts`)

**Working directory:** `C:\Users\Admin\flow-os`

---

## Phase 1 — Fix What's Wrong Daily

---

### Task 1: Meal Log Date Scoping

**Files:**
- Modify: `store/fitness.ts`

The `caloriesConsumed()` function sums every meal ever logged. Fix: add a `mealLogDate` field and reset the log when the date changes.

- [ ] **Step 1: Update `FitnessState` interface in `store/fitness.ts`**

Replace the existing `logDate: string` field and `mealLog` references. In the `FitnessState` interface, replace:
```typescript
logDate: string
```
with:
```typescript
mealLogDate: string
```

- [ ] **Step 2: Update store initialization**

In the `(set, get) => ({` block, replace:
```typescript
mealLog: [],
logDate: new Date().toISOString().split('T')[0],
```
with:
```typescript
mealLog: [],
mealLogDate: new Date().toISOString().split('T')[0],
```

- [ ] **Step 3: Update `addMeal` action**

Replace the existing `addMeal` implementation:
```typescript
addMeal: (m) =>
  set((s) => ({ mealLog: [...s.mealLog, { ...m, id: nanoid() }] })),
```
with:
```typescript
addMeal: (m) =>
  set((s) => {
    const today = new Date().toISOString().split('T')[0]
    const mealLog = s.mealLogDate !== today ? [] : s.mealLog
    return {
      mealLog: [...mealLog, { ...m, id: nanoid() }],
      mealLogDate: today,
    }
  }),
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `logDate` or `mealLogDate`

- [ ] **Step 5: Commit**

```bash
git add store/fitness.ts
git commit -m "fix: scope meal log to current date — reset on new day"
```

---

### Task 2: Budget Month Rollover + pb-24

**Files:**
- Modify: `app/(app)/budget/page.tsx`

The budget `month` field is set at store init and never updates. Add a mount effect that calls `archiveMonth()` when the month has changed, and fix the missing bottom padding.

- [ ] **Step 1: Update imports in `app/(app)/budget/page.tsx`**

Replace the existing import block at the top of the file:
```typescript
'use client'
import { useState } from 'react'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import RecurringExpenses from '@/components/budget/RecurringExpenses'
import { Plus } from 'lucide-react'
```
with:
```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import RecurringExpenses from '@/components/budget/RecurringExpenses'
import { useBudgetStore } from '@/store/budget'
import { Plus } from 'lucide-react'
```

- [ ] **Step 2: Add toast state + month rollover effect + fix padding**

Replace the full component body:
```typescript
export default function BudgetPage() {
  const [open, setOpen] = useState(false)
  const { archiveMonth } = useBudgetStore()
  const [archiveToast, setArchiveToast] = useState('')

  useEffect(() => {
    const store = useBudgetStore.getState()
    const currentMonth = new Date().toISOString().slice(0, 7)
    if (store.month !== currentMonth) {
      const oldMonth = new Date(store.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
      const newMonth = new Date(currentMonth + '-01').toLocaleString('default', { month: 'long' })
      archiveMonth()
      setArchiveToast(`${oldMonth} archived — budget reset for ${newMonth}`)
      setTimeout(() => setArchiveToast(''), 4000)
    }
  }, [archiveMonth])

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-4">
      <AnimatePresence>
        {archiveToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1D1D1F] text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg max-w-[360px] text-center"
          >
            {archiveToast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Budget</h1>
        <button
          onClick={() => setOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add transaction"
        >
          <Plus size={22} />
        </button>
      </div>
      <BalanceDisplay />
      <RecurringExpenses />
      <div className="w-full h-px bg-[#E5E5EA]" />
      <SpendingChart />
      <TransactionList />
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/(app)/budget/page.tsx
git commit -m "fix: budget month rollover on mount + pb-24 bottom padding"
```

---

### Task 3: lockIn() Duplicate Tasks Fix

**Files:**
- Modify: `components/planner/SchedulePlanner.tsx`

`lockIn()` calls `addTask()` for every block that came from existing `personalTasks`, creating duplicates on every Plan My Day lock-in.

- [ ] **Step 1: Fix the `lockIn` function in `SchedulePlanner.tsx`**

Find the `lockIn` function (line ~152). Replace the inner block:
```typescript
if (block.type === 'task') {
  addTask({
    title: block.title,
    done: false,
    priority: 'Medium',
    repeat: 'none',
    due: selectedDate,
  })
}
```
with:
```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/planner/SchedulePlanner.tsx
git commit -m "fix: prevent lockIn() from duplicating existing personal tasks"
```

---

### Task 4: Mobile pb-24 + Dead Code + Dead Cron

**Files:**
- Modify: `app/(app)/fitness/page.tsx`, `app/(app)/calendar/page.tsx`, `vercel.json`
- Delete: `lib/smart-parser.ts`, `lib/parser-rules.ts`, `components/home/DailyOverviewCard.tsx`

- [ ] **Step 1: Fix fitness page bottom padding**

In `app/(app)/fitness/page.tsx`, find:
```typescript
<div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4 space-y-4">
```
Replace `pb-4` with `pb-24`:
```typescript
<div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-4">
```

- [ ] **Step 2: Fix calendar page bottom padding**

In `app/(app)/calendar/page.tsx`, find:
```typescript
<div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4">
```
Replace `pb-4` with `pb-24`:
```typescript
<div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24">
```

- [ ] **Step 3: Remove dead Vercel cron**

Replace `vercel.json` contents entirely:
```json
{}
```

- [ ] **Step 4: Delete dead files**

Run:
```bash
rm lib/smart-parser.ts
rm lib/parser-rules.ts
rm components/home/DailyOverviewCard.tsx
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add app/(app)/fitness/page.tsx app/(app)/calendar/page.tsx vercel.json
git commit -m "fix: pb-24 on fitness+calendar pages, remove dead cron and dead code"
```

---

### Task 5: CalorieRing Touch Targets + Log Button to Footer

**Files:**
- Modify: `components/fitness/CalorieRing.tsx`

Two bugs: (1) Log button is inside scrollable BottomSheet content — moves to `footer` prop. (2) Delete button `<Trash2 size={12}>` has no padding — below 44pt touch target.

- [ ] **Step 1: Rewrite `CalorieRing.tsx`**

Replace the entire file with:
```typescript
'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings'
import { useFitnessStore } from '@/store/fitness'
import RingProgress from '@/components/ui/RingProgress'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

export default function CalorieRing() {
  const { calorieGoal } = useSettingsStore()
  const { mealLog, addMeal, deleteMeal, caloriesConsumed } = useFitnessStore()
  const consumed = caloriesConsumed()
  const pct = calorieGoal > 0 ? (consumed / calorieGoal) * 100 : 0
  const remaining = calorieGoal - consumed

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cals, setCals] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !cals) return
    addMeal({
      name: name.trim(),
      calories: Number(cals),
      protein: 0,
      carbs: 0,
      fat: 0,
      time: new Date().toTimeString().slice(0, 5),
    })
    setName('')
    setCals('')
    setOpen(false)
  }

  return (
    <div className="apple-card p-4">
      <div className="flex items-center gap-6 mb-4">
        <RingProgress
          value={pct}
          color={pct > 100 ? '#ff4d6a' : '#00d084'}
          size={100}
          strokeWidth={8}
          label={`${remaining}\nleft`}
        />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Calories
          </p>
          <p className="font-display text-3xl font-bold text-[#1D1D1F]">{consumed}</p>
          <p className="text-xs text-[#6E6E73]">of {calorieGoal} goal</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 flex items-center gap-1 text-[#1560FF] text-xs font-semibold active:scale-95 transition-transform"
          >
            <Plus size={14} /> Log meal
          </button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {mealLog.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-[#1D1D1F] truncate">{m.name}</span>
            <span className="font-mono text-xs text-[#6E6E73] whitespace-nowrap">
              {m.calories} kcal
            </span>
            <button
              onClick={() => deleteMeal(m.id)}
              className="text-[#6E6E73] active:text-[#ff4d6a] transition-colors flex-shrink-0 p-2"
              aria-label="Delete meal"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {mealLog.length === 0 && (
          <p className="text-[#6E6E73] text-xs text-center py-2">
            No meals logged today
          </p>
        )}
      </div>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Log Meal"
        footer={
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !cals}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-40 text-base"
          >
            Log
          </button>
        }
      >
        <div className="space-y-4">
          <input
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50 text-base"
            placeholder="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoCapitalize="sentences"
            enterKeyHint="next"
          />
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50 font-mono text-base"
            placeholder="Calories"
            value={cals}
            onChange={(e) => setCals(e.target.value)}
            enterKeyHint="done"
          />
        </div>
      </BottomSheet>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/fitness/CalorieRing.tsx
git commit -m "fix: CalorieRing log button in footer, 44pt delete touch target, calorieGoal from settings"
```

---

### Task 6: BottomNav Settings Refactor

**Files:**
- Modify: `components/nav/BottomNav.tsx`

Settings is rendered in an IIFE outside the `tabs.map()`, causing two Framer Motion elements to compete for `layoutId="nav-pill"`.

- [ ] **Step 1: Rewrite `BottomNav.tsx`**

Replace the entire file with:
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, CheckSquare, Calendar, DollarSign, Dumbbell, Settings } from 'lucide-react'

const tabs = [
  { href: '/home',     icon: Home,        label: 'Home' },
  { href: '/planner',  icon: CheckSquare, label: 'Planner' },
  { href: '/calendar', icon: Calendar,    label: 'Calendar' },
  { href: '/budget',   icon: DollarSign,  label: 'Budget' },
  { href: '/fitness',  icon: Dumbbell,    label: 'Fitness' },
  { href: '/settings', icon: Settings,    label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                    bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA]
                    safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 flex-1 py-1">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex items-center justify-center w-10 h-10"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-[#1560FF]/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  className={active ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </motion.div>
              <span className={`text-[10px] font-medium tracking-wide
                ${active ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/nav/BottomNav.tsx
git commit -m "fix: Settings tab in tabs array, eliminate duplicate nav-pill layoutId"
```

---

### Task 7: PWA Icons + Theme Color

**Files:**
- Modify: `scripts/gen-icons.mjs`, `public/manifest.json`, `app/layout.tsx`

- [ ] **Step 1: Install sharp as dev dependency**

Run: `npm install -D sharp`

- [ ] **Step 2: Rewrite `scripts/gen-icons.mjs`**

Replace the entire file with:
```javascript
// scripts/gen-icons.mjs
// Generates proper PWA icons using sharp (SVG → PNG)
import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [
  { size: 192, path: 'public/icons/192.png' },
  { size: 512, path: 'public/icons/512.png' },
  { size: 512, path: 'public/icons/maskable.png' },
]

for (const { size, path } of sizes) {
  const r = Math.round(size * 0.2)
  const inner = Math.round(size * 0.35)
  const cx = size / 2
  const cy = size / 2
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${r}" fill="#F5F5F7"/>
    <rect x="${cx - inner}" y="${cy - inner}" width="${inner * 2}" height="${inner * 2}" rx="${Math.round(inner * 0.3)}" fill="#1560FF"/>
    <text x="${cx}" y="${cy + inner * 0.35}" font-family="Arial,sans-serif" font-size="${inner}"
          font-weight="bold" fill="white" text-anchor="middle">F</text>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(path)
  console.log(`Created ${path}`)
}
console.log('Icons generated ✓')
```

- [ ] **Step 3: Run the icon generator**

Run: `node scripts/gen-icons.mjs`
Expected output:
```
Created public/icons/192.png
Created public/icons/512.png
Created public/icons/maskable.png
Icons generated ✓
```

- [ ] **Step 4: Fix manifest.json theme colors**

Replace `public/manifest.json` with:
```json
{
  "name": "FlowOS",
  "short_name": "FlowOS",
  "description": "Personal command center — Digital Flow Global",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F5F5F7",
  "theme_color": "#F5F5F7",
  "start_url": "/home",
  "scope": "/",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 5: Fix viewport themeColor in `app/layout.tsx`**

Find in `app/layout.tsx`:
```typescript
themeColor: '#FFFFFF',
```
Replace with:
```typescript
themeColor: '#F5F5F7',
```

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-icons.mjs public/manifest.json app/layout.tsx public/icons/
git commit -m "fix: generate real PWA icons, unify theme_color to #F5F5F7"
```

---

### Task 8: ai-chat Today Constant Fix

**Files:**
- Modify: `app/api/ai-chat/route.ts`

`const today` is module-scoped — evaluates once at cold-start and bakes in that date.

- [ ] **Step 1: Remove module-scoped `today` constant**

In `app/api/ai-chat/route.ts`, delete line 6:
```typescript
const today = new Date().toISOString().split('T')[0]
```

- [ ] **Step 2: Move `today` inside the POST handler and update SYSTEM constant**

The `SYSTEM` constant references `${today}` twice. Since `today` needs to be per-request, convert `SYSTEM` from a `const` to a function. Replace the `const SYSTEM = ...` block and the `POST` handler:

```typescript
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildSystem(today: string) {
  return `You are FlowOS, a smart personal assistant embedded in a productivity app.
The user types natural-language commands. Parse the intent and return ONLY valid JSON — no markdown, no code fences, no explanation.

Use EXACTLY one of these shapes:

Task:
{ "type": "task", "data": { "title": "...", "priority": "High|Medium|Low", "done": false, "repeat": "none" } }

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

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ type: 'unknown', message: 'AI not configured.' })

  const today = new Date().toISOString().split('T')[0]
  const { message } = await req.json()

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystem(today) },
          { role: 'user', content: message },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Groq API error:', data)
      return NextResponse.json({ type: 'unknown', message: 'AI error. Try again in a moment.' })
    }

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) {
      console.error('ai-chat: empty Groq response', JSON.stringify(data))
      return NextResponse.json({ type: 'unknown', message: 'No response from AI. Try rephrasing.' })
    }

    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('ai-chat error:', err)
    return NextResponse.json({
      type: 'unknown',
      message: 'Could not understand that. Try: "add task call John" or "spent $40 on food"',
    })
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/api/ai-chat/route.ts
git commit -m "fix: move today inside POST handler, add crm_note+crm_lead to AI prompt"
```

---

## Phase 2 — Home Screen Comes Alive

---

### Task 9: Fitness Store Streak Guard

**Files:**
- Modify: `store/fitness.ts`

`markWorkoutDone()` increments `workoutStreak` without checking if it was already done today. Add `lastStreakDate` guard.

- [ ] **Step 1: Add `lastStreakDate` to `FitnessState` interface**

In the `FitnessState` interface, after `workoutStreak: number`, add:
```typescript
lastStreakDate: string
```

- [ ] **Step 2: Initialize `lastStreakDate` in the store**

In the state initialization block, after `workoutStreak: 0,` add:
```typescript
lastStreakDate: '',
```

- [ ] **Step 3: Update `markWorkoutDone` action**

Replace:
```typescript
markWorkoutDone: () =>
  set((s) => ({ workoutStreak: s.workoutStreak + 1 })),
```
with:
```typescript
markWorkoutDone: () =>
  set((s) => {
    const today = new Date().toISOString().split('T')[0]
    if (s.lastStreakDate === today) return s
    return { workoutStreak: s.workoutStreak + 1, lastStreakDate: today }
  }),
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add store/fitness.ts
git commit -m "fix: markWorkoutDone guard against multi-tap — once per day only"
```

---

### Task 10: GymChecklist Streak Auto-Trigger

**Files:**
- Modify: `components/fitness/GymChecklist.tsx`

After each exercise toggle, if all exercises are done and today's streak hasn't been counted, call `markWorkoutDone()`.

- [ ] **Step 1: Rewrite `GymChecklist.tsx`**

Replace the entire file with:
```typescript
'use client'
import { useFitnessStore, type Exercise } from '@/store/fitness'
import { Trash2 } from 'lucide-react'

interface GymChecklistProps {
  day: string
  exercises: Exercise[]
  editing?: boolean
  onRemove?: (name: string) => void
}

export default function GymChecklist({ day, exercises, editing, onRemove }: GymChecklistProps) {
  const { toggleExercise, markWorkoutDone, lastStreakDate } = useFitnessStore()
  const today = new Date().toISOString().split('T')[0]

  function handleToggle(exName: string) {
    if (editing) return
    toggleExercise(day, exName)
    const updated = exercises.map(e =>
      e.name === exName ? { ...e, done: !e.done } : e
    )
    const allDone = updated.length > 0 && updated.every(e => e.done)
    if (allDone && lastStreakDate !== today) {
      markWorkoutDone()
    }
  }

  return (
    <div className="space-y-2">
      {exercises.map((ex) => (
        <div
          key={ex.name}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
            ${ex.done ? 'bg-[#00d084]/10 border-[#00d084]/20' : 'bg-[#F9F9F9] border-[#E5E5EA]'}`}
        >
          <button
            onClick={() => handleToggle(ex.name)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
              ${ex.done ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
          >
            {ex.done && <span className="text-white text-[10px] font-bold">✓</span>}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${ex.done ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'}`}>
              {ex.name}
            </p>
            <p className="font-mono text-[10px] text-[#6E6E73]">
              {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @ ${ex.weight}lbs` : ''}
            </p>
          </div>
          {editing && onRemove && (
            <button
              onClick={() => onRemove(ex.name)}
              className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/fitness/GymChecklist.tsx
git commit -m "feat: auto-trigger workout streak when all exercises are done"
```

---

### Task 11: Morning Brief API

**Files:**
- Create: `app/api/morning-brief/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/morning-brief/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ bullets: [], focus: '' })

  const body = await req.json()
  const { date, dayOfWeek, workout, personalTasks, crmTasksDueToday, calendarEvents, budget, calories } = body

  const system = `You are FlowOS, a sharp personal assistant. Generate a focused morning brief from today's context.
Be specific — name actual tasks and numbers, not generic advice.
Return ONLY valid JSON: { "bullets": ["...", "...", "..."], "focus": "..." }
Rules:
- bullets: 3-4 items, each under 12 words, start with an action verb or number
- focus: one sentence, the single most important thing today
- If no tasks/events, give a motivational but grounded observation
- TODAY is ${date}, ${dayOfWeek}`

  const userContent = JSON.stringify({
    workout,
    personalTasks,
    crmTasksDueToday,
    calendarEvents,
    budget,
    calories,
  })

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ bullets: [], focus: '' })

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) return NextResponse.json({ bullets: [], focus: '' })

    const parsed = JSON.parse(text)
    return NextResponse.json({
      bullets: parsed.bullets ?? [],
      focus: parsed.focus ?? '',
    })
  } catch {
    return NextResponse.json({ bullets: [], focus: '' })
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/api/morning-brief/route.ts
git commit -m "feat: morning brief API — Groq JSON mode, date-aware system prompt"
```

---

### Task 12: MorningBrief Component

**Files:**
- Create: `components/home/MorningBrief.tsx`

- [ ] **Step 1: Create `components/home/MorningBrief.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlannerStore } from '@/store/planner'
import { useFitnessStore } from '@/store/fitness'
import { useBudgetStore } from '@/store/budget'
import { useCalendarStore } from '@/store/calendar'
import { useSettingsStore } from '@/store/settings'
import { sb, fromSnake, type CRMTask } from '@/lib/supabase'

interface BriefData {
  bullets: string[]
  focus: string
}

export default function MorningBrief() {
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const { personalTasks } = usePlannerStore()
  const { workoutSchedule, workoutStreak, caloriesConsumed } = useFitnessStore()
  const { calorieGoal } = useSettingsStore()
  const { transactions, monthlyIncome } = useBudgetStore()
  const { events } = useCalendarStore()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `flowos-brief-${today}`

    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setBrief(JSON.parse(cached))
        setLoading(false)
        return
      } catch { /* fall through to fetch */ }
    }

    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayDay = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)[new Date().getDay()]
    const workout = workoutSchedule.find(d => d.day === todayDay)?.type ?? 'Rest Day'

    const calendarEvents = events
      .filter(e => e.date === today)
      .map(e => ({ title: e.title, time: e.time }))

    const spent = transactions.reduce((s, t) => s + t.amount, 0)
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate()

    ;(async () => {
      try {
        const { data: taskData } = await sb
          .from('tasks')
          .select('*')
          .eq('done', false)
          .lte('due', today)
        const crmTasksDueToday = (taskData ?? [])
          .map((r) => fromSnake<CRMTask>(r))
          .map(t => ({ title: t.title, related: t.related }))

        const res = await fetch('/api/morning-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today,
            dayOfWeek,
            workout,
            personalTasks: personalTasks.filter(t => !t.done).slice(0, 5).map(t => ({ title: t.title, priority: t.priority })),
            crmTasksDueToday: crmTasksDueToday.slice(0, 5),
            calendarEvents,
            budget: { spent: Math.round(spent), income: monthlyIncome, daysLeftInMonth: daysLeft },
            calories: { yesterday: caloriesConsumed(), goal: calorieGoal },
          }),
        })
        const data: BriefData = await res.json()
        if (data.focus) {
          setBrief(data)
          localStorage.setItem(cacheKey, JSON.stringify(data))
        }
      } catch { /* silent fail */ } finally {
        setLoading(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="apple-card px-5 py-4 space-y-2">
        <div className="h-4 bg-[#E5E5EA] rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-[#E5E5EA] rounded-full animate-pulse w-1/2" />
        <div className="h-3 bg-[#E5E5EA] rounded-full animate-pulse w-2/3" />
      </div>
    )
  }

  if (!brief || !brief.focus) return null

  const { workoutStreak: streak } = useFitnessStore.getState()

  return (
    <div className="apple-card px-5 py-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display italic text-base text-[#1D1D1F] flex-1 leading-snug">
            {brief.focus}
          </p>
          {streak > 0 && (
            <span className="flex-shrink-0 text-[11px] font-mono font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 px-2 py-1 rounded-full">
              🔥 {streak}d
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-[#AEAEB2] mt-1">
          {expanded ? '▴ Today\'s brief' : '▾ Today\'s brief'}
        </p>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2 mt-3"
          >
            {brief.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
                <span className="text-[#1560FF] font-mono flex-shrink-0">·</span>
                {b}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/home/MorningBrief.tsx
git commit -m "feat: MorningBrief component — localStorage cache, expand/collapse, streak chip"
```

---

### Task 13: Home Page Swap + AIChatInput CRM Actions

**Files:**
- Modify: `app/(app)/home/page.tsx`, `components/home/AIChatInput.tsx`
- Delete: `components/home/StreakTracker.tsx`

- [ ] **Step 1: Delete `StreakTracker.tsx`**

Run: `rm components/home/StreakTracker.tsx`

- [ ] **Step 2: Update `app/(app)/home/page.tsx`**

Replace the entire file:
```typescript
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AIChatInput from '@/components/home/AIChatInput'
import QuickActionChips from '@/components/home/QuickActionChips'
import CRMStatsGrid from '@/components/home/CRMStatsGrid'
import MorningBrief from '@/components/home/MorningBrief'
import { useSettingsStore } from '@/store/settings'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}.`
  if (h < 17) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
}

export default function HomePage() {
  const { userName } = useSettingsStore()
  const [chipHint, setChipHint] = useState('')

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="px-5 pt-14 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display italic text-3xl text-[#1D1D1F] leading-tight"
        >
          {getGreeting(userName)}
        </motion.h1>
      </div>

      <div className="px-4 mb-4">
        <MorningBrief />
      </div>

      <div className="px-4 mb-5">
        <AIChatInput
          externalValue={chipHint}
          onExternalValueConsumed={() => setChipHint('')}
        />
      </div>

      <div className="px-4 mb-6">
        <QuickActionChips onChipTap={hint => setChipHint(hint)} />
      </div>

      <div className="px-4 pb-24">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
          DFG CRM · Live
        </p>
        <CRMStatsGrid />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add voiceInput gate + CRM cases to `AIChatInput.tsx`**

In `components/home/AIChatInput.tsx`, add `useSettingsStore` to imports:
```typescript
import { useSettingsStore } from '@/store/settings'
import { sb, toSnake } from '@/lib/supabase'
```

Add to the destructured store values at the top of the component:
```typescript
const { voiceInput } = useSettingsStore()
```

In the `switch (result.type)` block, add two new cases before `default:`:
```typescript
case 'crm_note': {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await sb.from('activities').insert(toSnake({
    type: result.data.activityType,
    related: result.data.related,
    content: result.data.content,
    date: today,
    createdAt: new Date().toISOString(),
  }))
  if (error) {
    showToast(`Could not log activity: ${error.message}`, 'error')
  } else {
    showToast(`✓ ${result.data.activityType} logged: ${result.data.related}`)
  }
  break
}

case 'crm_lead': {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await sb.from('leads').insert(toSnake({
    ...result.data,
    stage: 'New Lead',
    date: today,
    notes: '',
  }))
  if (error) {
    showToast(`Could not add lead: ${error.message}`, 'error')
  } else {
    showToast(`✓ New lead added: ${result.data.name}`)
  }
  break
}
```

Find the mic button render:
```typescript
<button
  onClick={handleVoice}
  className="p-2 rounded-full text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
  type="button"
>
  <Mic size={16} />
</button>
```
Wrap it with a conditional:
```typescript
{voiceInput && (
  <button
    onClick={handleVoice}
    className="p-2 rounded-full text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
    type="button"
  >
    <Mic size={16} />
  </button>
)}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/(app)/home/page.tsx components/home/AIChatInput.tsx
git rm components/home/StreakTracker.tsx
git commit -m "feat: MorningBrief on home, voiceInput gate, crm_note+crm_lead AI actions"
```

---

## Phase 3 — Calendar & Planner Level Up

---

### Task 14: expandEvents Utility + Tests

**Files:**
- Create: `lib/calendar-utils.ts`
- Create: `__tests__/calendar-utils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/calendar-utils.test.ts`:
```typescript
import { expandEvents } from '@/lib/calendar-utils'
import type { CalendarEvent } from '@/store/calendar'

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'base-1',
    title: 'Test Event',
    date: '2026-06-07',
    color: '#1560FF',
    repeat: 'none',
    notify: false,
    notifyMinutesBefore: 0,
    type: 'personal',
    ...overrides,
  }
}

describe('expandEvents', () => {
  it('returns non-repeating events unchanged within range', () => {
    const ev = makeEvent({ date: '2026-06-07' })
    const result = expandEvents([ev], '2026-06-01', '2026-06-30')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('base-1')
  })

  it('excludes non-repeating events outside range', () => {
    const ev = makeEvent({ date: '2026-05-01' })
    const result = expandEvents([ev], '2026-06-01', '2026-06-30')
    expect(result).toHaveLength(0)
  })

  it('expands daily events within range', () => {
    const ev = makeEvent({ date: '2026-06-05', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-05', '2026-06-08')
    expect(result).toHaveLength(4)
    expect(result.map(e => e.date)).toEqual([
      '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08',
    ])
  })

  it('original event keeps its real id; virtual instances get suffixed ids', () => {
    const ev = makeEvent({ date: '2026-06-05', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-05', '2026-06-07')
    expect(result[0].id).toBe('base-1')
    expect(result[1].id).toBe('base-1-2026-06-06')
    expect(result[2].id).toBe('base-1-2026-06-07')
  })

  it('expands weekly events on the matching weekday', () => {
    const ev = makeEvent({ date: '2026-06-01', repeat: 'weekly' }) // Monday
    const result = expandEvents([ev], '2026-06-01', '2026-06-22')
    expect(result.map(e => e.date)).toEqual([
      '2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22',
    ])
  })

  it('expands monthly events on the matching day-of-month', () => {
    const ev = makeEvent({ date: '2026-01-15', repeat: 'monthly' })
    const result = expandEvents([ev], '2026-01-01', '2026-03-31')
    expect(result.map(e => e.date)).toEqual([
      '2026-01-15', '2026-02-15', '2026-03-15',
    ])
  })

  it('caps at 365 instances per event', () => {
    const ev = makeEvent({ date: '2024-01-01', repeat: 'daily' })
    const result = expandEvents([ev], '2024-01-01', '2026-12-31')
    expect(result).toHaveLength(365)
  })

  it('does not duplicate original date as virtual instance', () => {
    const ev = makeEvent({ date: '2026-06-07', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-07', '2026-06-09')
    const ids = result.map(e => e.id)
    expect(ids.filter(id => id === 'base-1')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail**

Run: `npx jest __tests__/calendar-utils.test.ts`
Expected: FAIL — `Cannot find module '@/lib/calendar-utils'`

- [ ] **Step 3: Create `lib/calendar-utils.ts`**

```typescript
import type { CalendarEvent } from '@/store/calendar'

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function expandEvents(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string
): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const MAX_PER_EVENT = 365

  for (const event of events) {
    if (event.repeat === 'none') {
      if (compareDates(event.date, rangeStart) >= 0 && compareDates(event.date, rangeEnd) <= 0) {
        result.push(event)
      }
      continue
    }

    let count = 0
    const originDate = new Date(event.date + 'T00:00:00')

    if (event.repeat === 'daily') {
      const startDate = compareDates(event.date, rangeStart) >= 0 ? event.date : rangeStart
      let cur = startDate
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        if (cur === event.date) {
          result.push(event)
        } else {
          result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
        }
        count++
        cur = addDays(cur, 1)
      }
    } else if (event.repeat === 'weekly') {
      const originDow = originDate.getDay()
      let cur = rangeStart
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        const curDow = new Date(cur + 'T00:00:00').getDay()
        if (curDow === originDow && compareDates(cur, event.date) >= 0) {
          if (cur === event.date) {
            result.push(event)
          } else {
            result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
          }
          count++
        }
        cur = addDays(cur, 1)
      }
    } else if (event.repeat === 'monthly') {
      const originDay = originDate.getDate()
      let cur = rangeStart
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        const curDate = new Date(cur + 'T00:00:00')
        const daysInMonth = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate()
        if (curDate.getDate() === Math.min(originDay, daysInMonth) && compareDates(cur, event.date) >= 0) {
          if (cur === event.date) {
            result.push(event)
          } else {
            result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
          }
          count++
        }
        cur = addDays(cur, 1)
      }
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests — expect them to pass**

Run: `npx jest __tests__/calendar-utils.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/calendar-utils.ts __tests__/calendar-utils.test.ts
git commit -m "feat: expandEvents utility for recurring calendar events"
```

---

### Task 15: MonthView + DayView Use expandEvents

**Files:**
- Modify: `components/calendar/MonthView.tsx`, `components/calendar/DayView.tsx`

- [ ] **Step 1: Update `MonthView.tsx`**

Replace the file with:
```typescript
'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const date = new Date(selectedDate + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const expanded = expandEvents(events, firstOfMonth, lastOfMonth)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const eventDates = new Set(expanded.map((e) => e.date))

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
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-[#1560FF] text-white'
                  : isToday
                  ? 'bg-[#1560FF]/20 text-[#1560FF]'
                  : 'text-[#1D1D1F] active:bg-[#E5E5EA]'
                }`}
            >
              {day}
              {hasEvent && (
                <div className="w-1 h-1 rounded-full bg-[#00d4ff] mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `DayView.tsx`**

Replace the file with:
```typescript
'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'
import Badge from '@/components/ui/Badge'

export default function DayView() {
  const { selectedDate, events } = useCalendarStore()
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
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/calendar/MonthView.tsx components/calendar/DayView.tsx
git commit -m "feat: MonthView and DayView show recurring event instances via expandEvents"
```

---

### Task 16: WeekView Component

**Files:**
- Create: `components/calendar/WeekView.tsx`

- [ ] **Step 1: Create `components/calendar/WeekView.tsx`**

```typescript
'use client'
import { useCalendarStore } from '@/store/calendar'
import { expandEvents } from '@/lib/calendar-utils'

const HOUR_START = 6   // 6am
const HOUR_END = 23    // 11pm
const TOTAL_HOURS = HOUR_END - HOUR_START
const SLOT_HEIGHT = 48 // px per hour

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getMondayOf(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ap}`
}

export default function WeekView() {
  const { selectedDate, events } = useCalendarStore()
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMondayOf(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = weekDays[6]

  const expanded = expandEvents(events, weekStart, weekEnd)

  const hours = Array.from({ length: TOTAL_HOURS * 2 }, (_, i) => {
    const totalMins = HOUR_START * 60 + i * 30
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return { label: m === 0 ? `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}` : '', mins: totalMins }
  })

  return (
    <div className="overflow-x-hidden">
      {/* Day headers */}
      <div className="flex pl-8 mb-1">
        {weekDays.map((day) => {
          const d = new Date(day + 'T00:00:00')
          const isToday = day === today
          return (
            <div key={day} className="flex-1 flex flex-col items-center">
              <span className="text-[9px] font-mono text-[#AEAEB2] uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xs font-semibold mt-0.5
                ${isToday ? 'text-[#1560FF]' : 'text-[#1D1D1F]'}`}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: SLOT_HEIGHT * TOTAL_HOURS }}>
        {/* Hour labels */}
        <div className="w-8 flex-shrink-0 relative">
          {hours.map((slot, i) => (
            slot.label ? (
              <div
                key={i}
                className="absolute right-1 text-[9px] font-mono text-[#AEAEB2] -translate-y-1/2"
                style={{ top: (i / 2) * SLOT_HEIGHT }}
              >
                {slot.label}
              </div>
            ) : null
          ))}
        </div>

        {/* Columns */}
        {weekDays.map((day) => {
          const isToday = day === today
          const dayEvents = expanded
            .filter(e => e.date === day && e.time)

          return (
            <div
              key={day}
              className={`flex-1 relative border-l border-[#F2F2F7]
                ${isToday ? 'bg-[#1560FF]/[0.025]' : ''}`}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-[#F2F2F7]"
                  style={{ top: i * SLOT_HEIGHT }}
                />
              ))}

              {/* Events */}
              {dayEvents.map((ev) => {
                const startMins = timeToMinutes(ev.time!)
                const endMins = ev.endTime ? timeToMinutes(ev.endTime) : startMins + 60
                const topPx = ((startMins - HOUR_START * 60) / 60) * SLOT_HEIGHT
                const heightPx = Math.max(28, ((endMins - startMins) / 60) * SLOT_HEIGHT)

                return (
                  <div
                    key={ev.id}
                    className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden"
                    style={{
                      top: topPx,
                      height: heightPx,
                      backgroundColor: ev.color + 'e6',
                    }}
                  >
                    <p className="text-white text-[9px] font-semibold leading-tight truncate">
                      {ev.title}
                    </p>
                    <p className="text-white/80 text-[8px] font-mono">
                      {fmt12(ev.time!)}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/calendar/WeekView.tsx
git commit -m "feat: WeekView time grid — Mon-Sun, 6am-11pm, recurring events, today highlight"
```

---

### Task 17: Calendar Page WeekView Integration

**Files:**
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Rewrite `app/(app)/calendar/page.tsx`**

Replace the entire file:
```typescript
'use client'
import { useState } from 'react'
import { useCalendarStore } from '@/store/calendar'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { view } = useCalendarStore()

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Calendar</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add event"
        >
          <Plus size={22} />
        </button>
      </div>
      <CalendarHeader />
      {view === 'month' && <MonthView />}
      {view === 'week' && <WeekView />}
      {view === 'day' && <DayView />}
      {(view === 'month' || view === 'day') && <DayView />}
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
```

Wait — DayView should only render in `day` mode and also in `month` mode (as a selected-day detail). Looking at the original: `<MonthView />` and `<DayView />` both render when on the calendar page (DayView shows events for the selected date). Let me correct this:

```typescript
'use client'
import { useState } from 'react'
import { useCalendarStore } from '@/store/calendar'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { view } = useCalendarStore()

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Calendar</h1>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add event"
        >
          <Plus size={22} />
        </button>
      </div>
      <CalendarHeader />
      {view === 'month' && (
        <>
          <MonthView />
          <DayView />
        </>
      )}
      {view === 'week' && <WeekView />}
      {view === 'day' && <DayView />}
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/(app)/calendar/page.tsx
git commit -m "feat: WeekView wired into calendar page, pb-24 bottom padding"
```

---

### Task 18: Planner Store Daily Reset

**Files:**
- Modify: `store/planner.ts`

`resetDailyTasks` is defined but never called; daily-repeat tasks never reset.

- [ ] **Step 1: Add `lastResetDate` to `PlannerState` interface**

In `store/planner.ts`, after `routines: Routine[]`, add to the interface:
```typescript
lastResetDate: string
resetDailyTasksIfNeeded: () => void
```

- [ ] **Step 2: Add field initialization**

In the state initialization object, after `routines: [],` add:
```typescript
lastResetDate: '',
```

- [ ] **Step 3: Add `resetDailyTasksIfNeeded` action**

In the actions, after `resetDailyTasks: () => ...`, add:
```typescript
resetDailyTasksIfNeeded: () =>
  set((s) => {
    const today = new Date().toISOString().split('T')[0]
    if (s.lastResetDate === today) return s
    return {
      personalTasks: s.personalTasks.map((t) =>
        t.repeat === 'daily' ? { ...t, done: false } : t
      ),
      lastResetDate: today,
    }
  }),
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add store/planner.ts
git commit -m "feat: resetDailyTasksIfNeeded — auto-reset daily repeat tasks once per day"
```

---

### Task 19: Planner Page Today/All Toggle

**Files:**
- Modify: `app/(app)/planner/page.tsx`

Add `'use client'` directive, Today/All segmented toggle, and call `resetDailyTasksIfNeeded` on mount.

- [ ] **Step 1: Rewrite `app/(app)/planner/page.tsx`**

Replace the entire file:
```typescript
'use client'
import { useState, useEffect } from 'react'
import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import Routines from '@/components/planner/Routines'
import WeeklyGoals from '@/components/planner/WeeklyGoals'
import LongTermGoals from '@/components/planner/LongTermGoals'
import SchedulePlanner from '@/components/planner/SchedulePlanner'
import { usePlannerStore } from '@/store/planner'

type PlannerView = 'today' | 'all'

export default function PlannerPage() {
  const [planView, setPlanView] = useState<PlannerView>('today')
  const { resetDailyTasksIfNeeded } = usePlannerStore()

  useEffect(() => {
    resetDailyTasksIfNeeded()
  }, [resetDailyTasksIfNeeded])

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Planner</h1>
        <SchedulePlanner />
      </div>

      {/* Today / All toggle */}
      <div className="flex bg-[#E5E5EA] rounded-2xl p-1">
        {(['today', 'all'] as PlannerView[]).map((v) => (
          <button
            key={v}
            onClick={() => setPlanView(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${planView === v
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73]'
              }`}
          >
            {v === 'today' ? 'Today' : 'All'}
          </button>
        ))}
      </div>

      <CRMTaskList todayOnly={planView === 'today'} />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <PersonalTaskList todayOnly={planView === 'today'} />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <Routines />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <WeeklyGoals />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <LongTermGoals />
    </div>
  )
}
```

- [ ] **Step 2: Update `CRMTaskList` to accept `todayOnly` prop**

In `components/planner/CRMTaskList.tsx`, update the component signature:
```typescript
export default function CRMTaskList({ todayOnly = false }: { todayOnly?: boolean }) {
```

In `fetchTasks`, add a filter when `todayOnly` is true. Find the Supabase query:
```typescript
const { data } = await sb
  .from('tasks')
  .select('*')
  .eq('done', false)
  .order('due', { ascending: true })
```
Replace with:
```typescript
const today = new Date().toISOString().split('T')[0]
let query = sb.from('tasks').select('*').eq('done', false).order('due', { ascending: true })
if (todayOnly) query = query.lte('due', today)
const { data } = await query
```

Also add `todayOnly` to the `useCallback` dependency array:
```typescript
const fetchTasks = useCallback(async () => {
  // ...
}, [todayOnly])
```

And add to the `useEffect`:
```typescript
useEffect(() => { fetchTasks() }, [fetchTasks])
```

- [ ] **Step 3: Update `PersonalTaskList` to accept `todayOnly` prop**

In `components/planner/PersonalTaskList.tsx`, find the component and add:
```typescript
export default function PersonalTaskList({ todayOnly = false }: { todayOnly?: boolean }) {
```

Then filter the tasks rendered:
```typescript
const today = new Date().toISOString().split('T')[0]
const displayTasks = todayOnly
  ? tasks.filter(t => !t.done && (t.due === today || !t.due))
  : tasks
```
Use `displayTasks` instead of `tasks` when rendering the list.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/(app)/planner/page.tsx components/planner/CRMTaskList.tsx components/planner/PersonalTaskList.tsx store/planner.ts
git commit -m "feat: planner Today/All toggle + auto daily task reset on mount"
```

---

## Phase 4 — Intelligence Layer

---

### Task 20: Budget Coach API

**Files:**
- Create: `app/api/budget-coach/route.ts`

- [ ] **Step 1: Create `app/api/budget-coach/route.ts`**

```typescript
import { NextRequest } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a personal finance coach. Analyze this month's spending and give specific, actionable advice.
Be direct — name dollar amounts, category names, and specific actions.
Format your response as:

HEALTH: green|yellow|red
SUMMARY: one sentence
ANOMALIES:
- [specific observation with dollar amounts]
ACTIONS:
- [specific action with dollar amounts]

Rules:
- Max 3 anomalies, max 3 actions
- Reference actual category names from the data
- "Misc" charges over $20 are worth investigating
- Compare spent vs cap for each category`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return new Response('GROQ_API_KEY not set', { status: 500 })

  const body = await req.json()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: JSON.stringify(body) },
            ],
            temperature: 0.3,
            max_tokens: 512,
            stream: true,
          }),
        })

        if (!res.ok || !res.body) {
          controller.enqueue(new TextEncoder().encode('Could not analyze budget.'))
          controller.close()
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const text = parsed.choices?.[0]?.delta?.content ?? ''
              if (text) controller.enqueue(new TextEncoder().encode(text))
            } catch { /* skip malformed SSE */ }
          }
        }
        controller.close()
      } catch {
        controller.enqueue(new TextEncoder().encode('Error analyzing budget.'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/api/budget-coach/route.ts
git commit -m "feat: budget coach streaming API"
```

---

### Task 21: Budget Page Budget Coach Button + store/budget removeCategory

**Files:**
- Modify: `app/(app)/budget/page.tsx`, `store/budget.ts`

- [ ] **Step 1: Add `removeCategory` to `store/budget.ts`**

In the `BudgetState` interface, add:
```typescript
removeCategory: (id: string) => void
```

In the actions, after `addCategory`:
```typescript
removeCategory: (id) =>
  set((s) => ({
    categories: s.categories.filter((c) => c.id !== id),
  })),
```

- [ ] **Step 2: Add Budget Coach button + BottomSheet to `budget/page.tsx`**

Update the imports to add `Sparkles`:
```typescript
import { Plus, Sparkles } from 'lucide-react'
```

Add coach state variables after the existing `useState`:
```typescript
const [coachOpen, setCoachOpen] = useState(false)
const [coachText, setCoachText] = useState('')
const [coachLoading, setCoachLoading] = useState(false)
const { categories, transactions, recurringExpenses, monthlyIncome } = useBudgetStore()
```

Add a `fetchCoach` function inside the component:
```typescript
async function fetchCoach() {
  setCoachText('')
  setCoachLoading(true)
  setCoachOpen(true)
  try {
    const res = await fetch('/api/budget-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ income: monthlyIncome, transactions, categories, recurringExpenses }),
    })
    if (!res.body) { setCoachLoading(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    setCoachLoading(false)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setCoachText(t => t + decoder.decode(value))
    }
  } catch {
    setCoachLoading(false)
    setCoachText('Could not analyze budget right now.')
  }
}
```

Update the header buttons:
```typescript
<div className="flex items-center gap-2">
  <button
    onClick={fetchCoach}
    className="flex items-center gap-1 text-[#1560FF] text-xs font-semibold px-3 py-2 rounded-full bg-[#1560FF]/10 active:scale-90 transition-transform"
    aria-label="Budget advice"
  >
    <Sparkles size={14} />
    <span>Advice</span>
  </button>
  <button
    onClick={() => setOpen(true)}
    className="text-[#1560FF] active:scale-90 transition-transform"
    aria-label="Add transaction"
  >
    <Plus size={22} />
  </button>
</div>
```

Add the Budget Coach BottomSheet before the closing `</div>`:
```typescript
<BottomSheet
  open={coachOpen}
  onClose={() => setCoachOpen(false)}
  title="Budget Coach"
  footer={
    <button
      onClick={() => setCoachOpen(false)}
      className="w-full bg-[#F5F5F7] text-[#1D1D1F] font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
    >
      Close
    </button>
  }
>
  {coachLoading ? (
    <div className="space-y-3 py-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-4 bg-[#E5E5EA] rounded-full animate-pulse" style={{ width: `${60 + i * 15}%` }} />
      ))}
    </div>
  ) : (
    <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-wrap font-mono">
      {coachText || 'Analyzing your budget…'}
    </p>
  )}
</BottomSheet>
```

Also add `BottomSheet` to imports:
```typescript
import BottomSheet from '@/components/ui/BottomSheet'
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/(app)/budget/page.tsx store/budget.ts
git commit -m "feat: budget coach button + streaming sheet, removeCategory action"
```

---

### Task 22: ManageCategories Component

**Files:**
- Create: `components/budget/ManageCategories.tsx`
- Modify: `app/(app)/budget/page.tsx` (add ManageCategories below RecurringExpenses)

- [ ] **Step 1: Create `components/budget/ManageCategories.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useBudgetStore } from '@/store/budget'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

const COLOR_OPTIONS = ['#1560FF', '#00d084', '#ffb547', '#a855f7', '#ff4d6a', '#00d4ff']

export default function ManageCategories() {
  const { categories, transactions, addCategory, removeCategory } = useBudgetStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [cap, setCap] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])

  function handleAdd() {
    if (!name.trim() || !cap) return
    addCategory({ name: name.trim(), cap: Number(cap), color })
    setName('')
    setCap('')
    setColor(COLOR_OPTIONS[0])
    setSheetOpen(false)
  }

  function canDelete(categoryId: string): boolean {
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return false
    return !transactions.some(t => t.category === cat.name)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Categories</p>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1560FF]/10 text-[#1560FF] active:scale-90 transition-transform"
          aria-label="Add category"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(cat => {
          const deletable = canDelete(cat.id)
          return (
            <div key={cat.id} className="apple-card p-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <p className="flex-1 text-sm font-medium text-[#1D1D1F]">{cat.name}</p>
              <p className="font-mono text-xs text-[#6E6E73]">${cat.cap}/mo</p>
              <button
                onClick={() => deletable && removeCategory(cat.id)}
                className={`p-2 transition-colors ${deletable ? 'text-[#AEAEB2] active:text-[#ff4d6a]' : 'text-[#E5E5EA] cursor-not-allowed'}`}
                aria-label={deletable ? 'Delete category' : 'Category in use'}
                disabled={!deletable}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Add Category"
        footer={
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !cap}
            className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base disabled:opacity-40"
          >
            Add Category
          </button>
        }
      >
        <div className="space-y-4">
          <input
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 text-base"
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            autoCapitalize="words"
            enterKeyHint="next"
          />
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                       text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/60 font-mono text-base"
            placeholder="Monthly cap ($)"
            value={cap}
            onChange={e => setCap(e.target.value)}
            enterKeyHint="done"
          />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">Color</p>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all active:scale-90
                    ${color === c ? 'border-[#1D1D1F] scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
```

- [ ] **Step 2: Add ManageCategories to budget page**

In `app/(app)/budget/page.tsx`, add import:
```typescript
import ManageCategories from '@/components/budget/ManageCategories'
```

Add after `<RecurringExpenses />`:
```typescript
<div className="w-full h-px bg-[#E5E5EA]" />
<ManageCategories />
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/budget/ManageCategories.tsx app/(app)/budget/page.tsx
git commit -m "feat: ManageCategories component — add/delete budget categories"
```

---

### Task 23: CRM Coach API

**Files:**
- Create: `app/api/crm-coach/route.ts`

- [ ] **Step 1: Create `app/api/crm-coach/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a B2B sales coach for a digital agency offering web development, growth marketing, and foundation packages.
Given a lead's status, recommend the single best next action.
Return ONLY valid JSON: { "action": "...", "urgency": "high|medium|low", "message_draft": "...", "reason": "..." }
Rules:
- action: under 10 words, imperative
- message_draft: ready to send, conversational, under 60 words, no placeholders
- urgency: high if 5+ days since contact or deal is closing, medium otherwise, low if new lead
- reason: one sentence explaining timing`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })

  const body = await req.json()

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: JSON.stringify(body) },
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const text: string = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('crm-coach error:', err)
    return NextResponse.json({ error: 'Failed to get coaching' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/api/crm-coach/route.ts
git commit -m "feat: CRM coach API — Groq JSON mode, urgency + message draft"
```

---

### Task 24: CRMTaskList Coach Chip

**Files:**
- Modify: `components/planner/CRMTaskList.tsx`

- [ ] **Step 1: Add coach state + imports to `CRMTaskList.tsx`**

Add to the imports at the top:
```typescript
import { Sparkles } from 'lucide-react'
```

Add state variables inside the component, after existing state:
```typescript
const [coachTask, setCoachTask] = useState<CRMTask | null>(null)
const [coachOpen, setCoachOpen] = useState(false)
const [coachResult, setCoachResult] = useState<{
  action: string; urgency: string; message_draft: string; reason: string
} | null>(null)
const [coachLoading, setCoachLoading] = useState(false)
```

Add the fetch coach function:
```typescript
async function handleCoach(task: CRMTask) {
  setCoachTask(task)
  setCoachResult(null)
  setCoachLoading(true)
  setCoachOpen(true)
  try {
    const res = await fetch('/api/crm-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: task.related,
        business: '',
        stage: task.priority,
        service: '',
        value: 0,
        notes: task.title,
        daysSinceContact: 0,
      }),
    })
    const data = await res.json()
    setCoachResult(data)
  } catch {
    setCoachResult(null)
  } finally {
    setCoachLoading(false)
  }
}
```

- [ ] **Step 2: Add Coach chip to each task card**

In the task card JSX, find the bottom action buttons area. After the `<Pencil>` and `<Trash2>` buttons, add — but insert the Coach chip inside the task info div, between `{t.related && ...}` and the closing `</div>`. Place it right after the `related` paragraph:

```typescript
{t.related && (
  <button
    onClick={() => handleCoach(t)}
    className="mt-1 flex items-center gap-1 text-[10px] font-mono font-semibold text-[#1560FF] bg-[#1560FF]/10 px-2 py-1 rounded-full active:scale-90 transition-transform"
  >
    <Sparkles size={10} />
    Coach
  </button>
)}
```

- [ ] **Step 3: Add Coach BottomSheet at the end of the component (before return closing tag)**

Add before the final closing `</div>`:
```typescript
<BottomSheet
  open={coachOpen}
  onClose={() => setCoachOpen(false)}
  title={`Coach · ${coachTask?.related ?? ''}`}
  footer={
    coachResult?.message_draft ? (
      <button
        onClick={() => {
          navigator.clipboard.writeText(coachResult.message_draft)
          setCoachOpen(false)
        }}
        className="w-full bg-[#1560FF] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
      >
        Copy Message
      </button>
    ) : (
      <button
        onClick={() => setCoachOpen(false)}
        className="w-full bg-[#F5F5F7] text-[#1D1D1F] font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
      >
        Close
      </button>
    )
  }
>
  {coachLoading ? (
    <div className="space-y-3 py-4">
      {[1, 2].map(i => (
        <div key={i} className="h-4 bg-[#E5E5EA] rounded-full animate-pulse" style={{ width: `${50 + i * 20}%` }} />
      ))}
    </div>
  ) : coachResult ? (
    <div className="space-y-4">
      <div>
        <p className="text-base font-bold text-[#1D1D1F]">{coachResult.action}</p>
        <p className="text-xs text-[#6E6E73] mt-1">{coachResult.reason}</p>
      </div>
      {coachResult.urgency && (
        <span className={`text-[11px] font-mono font-semibold px-2 py-1 rounded-full
          ${coachResult.urgency === 'high' ? 'bg-[#ff4d6a]/10 text-[#ff4d6a]'
            : coachResult.urgency === 'medium' ? 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
            : 'bg-[#C7C7CC]/30 text-[#6E6E73]'}`}>
          {coachResult.urgency} urgency
        </span>
      )}
      {coachResult.message_draft && (
        <div className="bg-[#F5F5F7] rounded-2xl px-4 py-4 border-l-4 border-[#1560FF]">
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{coachResult.message_draft}</p>
        </div>
      )}
    </div>
  ) : (
    <p className="text-sm text-[#6E6E73] text-center py-8">Could not load advice.</p>
  )}
</BottomSheet>
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add components/planner/CRMTaskList.tsx
git commit -m "feat: CRM task Coach chip — Groq deal advice + copy-ready message draft"
```

---

### Task 25: Schedule Context (existingEvents)

**Files:**
- Modify: `components/planner/SchedulePlanner.tsx`, `app/api/schedule/route.ts`

- [ ] **Step 1: Pass existingEvents in `SchedulePlanner.tsx`**

In `SchedulePlanner.tsx`, find the `generate` function. Add `useCalendarStore` import if not present:
```typescript
import { useCalendarStore } from '@/store/calendar'
```

Add to the destructured store values:
```typescript
const { addEvent, selectedDate, events: calendarEvents } = useCalendarStore()
```

In the `generate` function, find the `fetch('/api/schedule', ...)` call. Before the fetch, compute existing events:
```typescript
const existingEvents = calendarEvents
  .filter(e => e.date === selectedDate && e.time)
  .map(e => ({ title: e.title, time: e.time!, duration: 60 }))
```

In the `body: JSON.stringify({...})` call, add `existingEvents`:
```typescript
body: JSON.stringify({
  tasks: allTasks,
  wakeTime,
  currentSchedule: adj ? schedule : undefined,
  adjustments: adj || undefined,
  existingEvents: existingEvents.length > 0 ? existingEvents : undefined,
}),
```

- [ ] **Step 2: Consume `existingEvents` in `app/api/schedule/route.ts`**

In the POST handler, update the destructure:
```typescript
const { tasks, wakeTime = '08:00', currentSchedule, adjustments, existingEvents } = await req.json()
```

Update `userContent` to inject existing events when present:
```typescript
const existingBlock = existingEvents && existingEvents.length > 0
  ? `\nExisting calendar events (do NOT schedule over these):\n${(existingEvents as { time: string; title: string }[]).map(e => `- ${e.time}: ${e.title}`).join('\n')}`
  : ''

const userContent = adjustments
  ? `Current schedule: ${JSON.stringify(currentSchedule)}\nUser adjustment request: "${adjustments}"\nReturn an updated schedule JSON.`
  : `Wake time: ${wakeTime}\nTasks for today:\n${(tasks as string[]).map((t, i) => `${i + 1}. ${t}`).join('\n')}${existingBlock}\nBuild a time-blocked schedule.`
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/planner/SchedulePlanner.tsx app/api/schedule/route.ts
git commit -m "fix: pass existing calendar events to schedule API to prevent double-booking"
```

---

### Task 26: Per-Day Exercise Log

**Files:**
- Modify: `store/fitness.ts`, `components/fitness/GymChecklist.tsx`

This replaces the `exercise.done` field mutation introduced in Task 10. The `done` field on the template is no longer meaningful — completion is tracked per-day in `exerciseLog`.

- [ ] **Step 1: Update `FitnessState` interface in `store/fitness.ts`**

Add to the interface:
```typescript
exerciseLog: Record<string, string[]>
toggleExerciseLog: (day: string, exName: string) => void
isExerciseDone: (day: string, exName: string) => boolean
```

- [ ] **Step 2: Initialize `exerciseLog` in store state**

After `lastStreakDate: '',` add:
```typescript
exerciseLog: {},
```

- [ ] **Step 3: Add `toggleExerciseLog` and `isExerciseDone` actions**

After the `markWorkoutDone` action, add:
```typescript
toggleExerciseLog: (day, exName) =>
  set((s) => {
    const today = new Date().toISOString().split('T')[0]
    const key = `${day}-${today}`
    const current = s.exerciseLog[key] ?? []
    const next = current.includes(exName)
      ? current.filter(n => n !== exName)
      : [...current, exName]
    return { exerciseLog: { ...s.exerciseLog, [key]: next } }
  }),
isExerciseDone: (day, exName) => {
  const today = new Date().toISOString().split('T')[0]
  const key = `${day}-${today}`
  return (useFitnessStore.getState().exerciseLog[key] ?? []).includes(exName)
},
```

Note: `isExerciseDone` is a selector that reads from `getState()` — it is not reactive from `set`. Components that need reactivity should read `exerciseLog` directly from the store and compute the check inline.

- [ ] **Step 4: Rewrite `GymChecklist.tsx` to use `exerciseLog`**

Replace the entire file:
```typescript
'use client'
import { useFitnessStore, type Exercise } from '@/store/fitness'
import { Trash2 } from 'lucide-react'

interface GymChecklistProps {
  day: string
  exercises: Exercise[]
  editing?: boolean
  onRemove?: (name: string) => void
}

export default function GymChecklist({ day, exercises, editing, onRemove }: GymChecklistProps) {
  const { toggleExerciseLog, markWorkoutDone, lastStreakDate, exerciseLog } = useFitnessStore()
  const today = new Date().toISOString().split('T')[0]
  const logKey = `${day}-${today}`
  const completedToday = exerciseLog[logKey] ?? []

  function isExerciseDone(exName: string): boolean {
    return completedToday.includes(exName)
  }

  function handleToggle(exName: string) {
    if (editing) return
    toggleExerciseLog(day, exName)
    const nowDone = !completedToday.includes(exName)
    const willAllBeDone = exercises.every(e =>
      e.name === exName ? nowDone : completedToday.includes(e.name)
    )
    if (willAllBeDone && exercises.length > 0 && lastStreakDate !== today) {
      markWorkoutDone()
    }
  }

  return (
    <div className="space-y-2">
      {exercises.map((ex) => {
        const done = isExerciseDone(ex.name)
        return (
          <div
            key={ex.name}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
              ${done ? 'bg-[#00d084]/10 border-[#00d084]/20' : 'bg-[#F9F9F9] border-[#E5E5EA]'}`}
          >
            <button
              onClick={() => handleToggle(ex.name)}
              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                ${done ? 'bg-[#00d084] border-[#00d084]' : 'border-[#C7C7CC]'}`}
            >
              {done && <span className="text-white text-[10px] font-bold">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${done ? 'line-through text-[#6E6E73]' : 'text-[#1D1D1F]'}`}>
                {ex.name}
              </p>
              <p className="font-mono text-[10px] text-[#6E6E73]">
                {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @ ${ex.weight}lbs` : ''}
              </p>
            </div>
            {editing && onRemove && (
              <button
                onClick={() => onRemove(ex.name)}
                className="text-[#AEAEB2] active:text-[#ff4d6a] transition-colors p-2"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add store/fitness.ts components/fitness/GymChecklist.tsx
git commit -m "fix: per-day exercise log — exercises reset each day, workoutSchedule is read-only template"
```

---

### Task 27: calorieGoal Unification

**Files:**
- Modify: `store/fitness.ts`

Remove `calorieGoal` and `setCalorieGoal` from `useFitnessStore`. `CalorieRing.tsx` was already updated in Task 5 to read from `useSettingsStore`.

- [ ] **Step 1: Remove `calorieGoal` and `setCalorieGoal` from `FitnessState` interface**

In `store/fitness.ts`, remove from the interface:
```typescript
calorieGoal: number
setCalorieGoal: (n: number) => void
```

- [ ] **Step 2: Remove initialization and action from store body**

Remove the initialization: `calorieGoal: 2000,`

Remove the action:
```typescript
setCalorieGoal: (calorieGoal) => set({ calorieGoal }),
```

- [ ] **Step 3: Verify no other components read calorieGoal from useFitnessStore**

Run:
```bash
grep -r "useFitnessStore" --include="*.tsx" --include="*.ts" -l
```
For each file, check it doesn't destructure `calorieGoal` from `useFitnessStore`. If any file does, update it to use `useSettingsStore().calorieGoal` instead.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add store/fitness.ts
git commit -m "fix: remove calorieGoal from fitnessStore — single source of truth in settingsStore"
```

---

## Self-Review Checklist

- [x] **Spec coverage**: All 27 spec items have a task
- [x] **Placeholder scan**: No TBD/TODO found in any task
- [x] **Type consistency**: `mealLogDate` consistent across Task 1 steps; `exerciseLog` key format `"${day}-${today}"` consistent between Task 26 store and component; `lastStreakDate` used identically in Tasks 9 and 10/26
- [x] **Phase 2/4 cross-dependency**: Task 10 (GymChecklist streak using `done` field) is superseded by Task 26. If applying in one session, skip Task 10's GymChecklist rewrite and go straight to Task 26's version
- [x] **PersonalTaskList todayOnly prop**: Task 19 assumes this component accepts a `todayOnly` prop — if it doesn't exist yet, the step in Task 19 adds it
- [x] **BottomSheet import in budget page**: Task 21 adds the import; Task 2 also modifies the file — apply in order

---

*27 tasks · ~4 phases · commit per task*
