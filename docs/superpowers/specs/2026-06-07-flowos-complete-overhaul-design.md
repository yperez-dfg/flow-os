# FlowOS Complete Overhaul — Design Spec
**Date:** 2026-06-07  
**Status:** Approved  
**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · Zustand (persist) · Framer Motion · Groq Llama 3.3 70B · Supabase · Serwist PWA  
**Primary target:** iPhone Safari installed PWA  

---

## Overview

Four sequential phases ordered by immediate user impact. Each phase is independently deployable. Phases do not introduce breaking changes to previous phases.

**Architectural decisions locked in:**
- Recurring events: derived at render time via utility (never stored)
- `calorieGoal`: removed from `useFitnessStore`, owned by `useSettingsStore`
- Morning Brief: cached in `localStorage` by date key (one Groq call/day max)
- Push notifications: `setTimeout`-based in-session only; server push deferred to future

---

## Phase 1 — Fix What's Wrong Daily

### 1.1 Meal Log Date Scoping

**Problem:** `caloriesConsumed()` sums all `mealLog` entries ever — no date filter. Every historical meal inflates today's total.

**Fix — `store/fitness.ts`:**
- Add field `mealLogDate: string` (default: today's ISO date)
- In `addMeal`: before pushing, check `get().mealLogDate !== today`. If stale, clear `mealLog` and update `mealLogDate` first, then push the new entry
- `caloriesConsumed()` is already correct once the log is date-scoped — no change needed there
- Remove the now-unused `logDate` field (it existed but was never checked)

No history feature — this is a daily tracker. Past days are not stored.

### 1.2 Budget Month Rollover

**Problem:** `store.month` is set at store initialization and never updates. All transactions since install accumulate in "this month."

**Fix — `app/(app)/budget/page.tsx`:**
- Add a `useEffect` on mount: compare `useBudgetStore.getState().month` to `new Date().toISOString().slice(0,7)`
- If stale: call `archiveMonth()`, then show a toast: *"[Month name] archived — budget reset for [new month]"*
- Toast uses the existing `showToast` pattern from `AIChatInput` — extract it to a shared `useToast` hook or duplicate the pattern locally

### 1.3 lockIn() Duplicate Tasks

**Problem:** `SchedulePlanner.tsx:158-164` calls `addTask()` for every task-type block, but those blocks came from existing `personalTasks`. This creates duplicates on every Plan My Day lock-in.

**Fix — `SchedulePlanner.tsx`:**
- Replace the unconditional `addTask()` call inside `lockIn()` with a guard: `if (!personalTasks.some(t => t.title === block.title)) { addTask(...) }`
- This lets genuinely new titles (typed into the "Add More" field) become tasks, while existing tasks are never duplicated
- Keep the `addEvent()` call (calendar event creation is correct)
- Keep the `scheduleLocalNotification()` call

### 1.4 Mobile Bottom Padding

**Problem:** Budget, Fitness, and Calendar pages use `pb-4` (16px). Content at the bottom is hidden behind the 80px+ bottom nav on iPhone.

**Fix:** Change `pb-4` → `pb-24` on the outermost container `div` in:
- `app/(app)/budget/page.tsx`
- `app/(app)/fitness/page.tsx`
- `app/(app)/calendar/page.tsx`

### 1.5 CalorieRing "Log Meal" Button in Footer Slot

**Problem:** The Log button in `CalorieRing.tsx`'s BottomSheet is inside scrollable content. With iOS keyboard open, it can scroll out of view.

**Fix — `CalorieRing.tsx`:**
- Move the Log button out of the BottomSheet children and into the `footer` prop
- The BottomSheet's visual viewport listener already pins the footer above the keyboard

### 1.6 Touch Target Fixes

**Problem:** Several icon buttons are below Apple's 44pt touch target minimum.

**Fixes:**
- `CalorieRing.tsx` meal delete: `<Trash2 size={12}>` → `size={14}` + add `p-2` class to the button
- `CRMTaskList.tsx` edit and delete icon buttons: currently `p-2` (32px effective) → `p-3` (44px effective)
- `BottomNav.tsx`: refactor the Settings tab out of the inline IIFE and into the `tabs` array. This also fixes the duplicate `layoutId="nav-pill"` bug where two Framer Motion elements compete for the same layout ID

### 1.7 Dead Vercel Cron

**Problem:** `vercel.json` schedules `GET /api/cron/gameplan-notify` nightly. No such route exists — fires into a 404 every night.

**Fix — `vercel.json`:** Remove the `crons` array entirely (or comment out). Route can be created in Phase 4 if desired.

### 1.8 PWA Icons

**Problem:** `public/icons/192.png`, `512.png`, and `maskable.png` are each 70 bytes — placeholder/corrupt files. The installed PWA shows a blank icon.

**Fix:** Run `node scripts/gen-icons.mjs` to generate proper icon PNGs.

**Also fix `theme_color` conflict:** `manifest.json` has `background_color: "#07080F"` (dark) but `app/layout.tsx` viewport sets `themeColor: '#FFFFFF'`. Unify to `#F5F5F7` (the actual app background) in both `manifest.json` (`background_color` + `theme_color`) and the `viewport` export in `app/layout.tsx`.

### 1.9 Dead Code Removal

Delete the following files — they are never imported and add ~10KB of dead weight:
- `lib/smart-parser.ts`
- `lib/parser-rules.ts`
- `components/home/DailyOverviewCard.tsx`

### 1.10 `today` Constant in ai-chat Route

**Problem:** `const today = new Date().toISOString().split('T')[0]` is module-scoped in `app/api/ai-chat/route.ts`. It bakes in the date at cold-start time.

**Fix:** Move the `today` declaration inside the `POST` handler body so it's evaluated per-request.

---

## Phase 2 — Home Screen Comes Alive

### 2.1 Morning Brief

**New file: `app/api/morning-brief/route.ts`**

POST endpoint. Accepts:
```ts
{
  date: string           // YYYY-MM-DD
  dayOfWeek: string      // "Saturday"
  workout: string        // "Cardio" | "Rest Day" | "Push Day" etc.
  personalTasks: { title: string; priority: string }[]
  crmTasksDueToday: { title: string; related: string }[]
  calendarEvents: { title: string; time?: string }[]
  budget: { spent: number; income: number; daysLeftInMonth: number }
  calories: { yesterday: number; goal: number }
}
```

Returns streamed JSON:
```ts
{
  bullets: string[]   // 3–4 bullets, each under 12 words
  focus: string       // single sentence: today's most important thing
}
```

System prompt:
```
You are FlowOS, a sharp personal assistant. Generate a focused morning brief from today's context.
Be specific — name actual tasks and numbers, not generic advice.
Return ONLY valid JSON: { "bullets": ["...", "...", "..."], "focus": "..." }
Rules:
- bullets: 3-4 items, each under 12 words, start with an action verb or number
- focus: one sentence, the single most important thing today
- If no tasks/events, give a motivational but grounded observation
- TODAY is {date}, {dayOfWeek}
```

Temperature: 0.5. Max tokens: 256. Use `response_format: { type: 'json_object' }`.

**New file: `components/home/MorningBrief.tsx`**

- On mount: check `localStorage.getItem('flowos-brief-2026-06-07')` (key includes today's date)
- If hit: parse and display immediately
- If miss: fetch `/api/morning-brief` with context assembled from stores, cache result in `localStorage`
- Loading state: 3-line skeleton shimmer matching the card dimensions
- Collapsed view (default): shows `focus` line in italic display font, small "▾ Today's brief" label
- Expanded (tap to toggle): shows all bullets as a list
- Mobile: full-width card with `apple-card` class, `px-5 py-4`, gap between bullets `space-y-2`
- Error state: silently hide the card (don't show an error — morning shouldn't start with a broken UI)

**Integration — `app/(app)/home/page.tsx`:**
- Replace `<StreakTracker streak={0} />` with `<MorningBrief />`
- Pass streak display into MorningBrief (shows workout streak beside the focus line): `workoutStreak` from `useFitnessStore`
- Assemble context from existing store reads already on the page

### 2.2 Real Streak Computation

**Problem:** `markWorkoutDone()` increments `workoutStreak` but is never called. Streak shows 0 forever.

**Fix — `store/fitness.ts`:**
- Add `lastStreakDate: string` field (default empty string)
- Modify `markWorkoutDone()`: only increment if `lastStreakDate !== today`. Set `lastStreakDate = today` after incrementing. This prevents multi-tap inflation.

**Fix — `components/fitness/GymChecklist.tsx`:**
- After each `toggleExercise` call, check if all exercises for the day are now `done` (using the existing `done` field — Phase 4.4 will replace this with `isExerciseDone` when the exercise log is introduced)
- If all done and `lastStreakDate !== today`: call `markWorkoutDone()`
- Use `useFitnessStore` to read `lastStreakDate` for the guard
- **Note:** Phase 4.4 updates this completion detection to use `isExerciseDone` — the two changes must be applied together if implemented in the same session

**Integration — `components/home/MorningBrief.tsx`:**
- Display `workoutStreak` from `useFitnessStore` as a small chip: *"🔥 {n} day streak"* in the card

### 2.3 voiceInput Toggle Gates Mic Button

**Problem:** The mic button in `AIChatInput.tsx` renders unconditionally regardless of the Settings toggle.

**Fix — `AIChatInput.tsx`:**
- Read `const { voiceInput } = useSettingsStore()`
- Conditionally render the mic button: `{voiceInput && <button onClick={handleVoice}>...`

### 2.4 CRM AI Actions from Chat

**Problem:** The AI chat can create tasks, reminders, expenses, and meals but can't touch the CRM. Logging a call or adding a lead requires opening the separate DFG CRM app.

**Fix — `app/api/ai-chat/route.ts`:**

Add two new response shapes to the SYSTEM prompt:

```
CRM activity note (call, email, meeting, SMS, general note):
{ "type": "crm_note", "data": { "related": "...", "content": "...", "activityType": "call|email|meeting|note|sms" } }

New CRM lead:
{ "type": "crm_lead", "data": { "name": "...", "business": "...", "phone": "...", "source": "...", "service": "Full Stack|Growth|Foundation", "value": <number> } }
```

Add to prompt rules:
- `"Called John at Marcus LLC, left voicemail"` → `crm_note`, activityType: "call"
- `"New lead: Sarah from Bloom Bakery, wants website, $2500"` → `crm_lead`
- `"Emailed proposal to Marcus"` → `crm_note`, activityType: "email"

**Fix — `components/home/AIChatInput.tsx`:**

Add two new cases in `handleSubmit`:

```ts
case 'crm_note': {
  const today = new Date().toISOString().split('T')[0]
  await sb.from('activities').insert(toSnake({
    type: result.data.activityType,
    related: result.data.related,
    content: result.data.content,
    date: today,
    createdAt: new Date().toISOString(),
  }))
  showToast(`✓ ${result.data.activityType} logged: ${result.data.related}`)
  break
}

case 'crm_lead': {
  const today = new Date().toISOString().split('T')[0]
  await sb.from('leads').insert(toSnake({
    ...result.data,
    stage: 'New Lead',
    date: today,
    notes: '',
  }))
  showToast(`✓ New lead added: ${result.data.name}`)
  break
}
```

Import `sb` and `toSnake` from `@/lib/supabase`. Handle Supabase errors with an `error`-type toast.

---

## Phase 3 — Calendar & Planner Level Up

### 3.1 Recurring Event Expansion

**Problem:** Events with `repeat: 'weekly' | 'daily' | 'monthly'` only appear on their original date. Recurring bills, workout syncs, and repeating reminders are invisible on future dates.

**New file: `lib/calendar-utils.ts`**

```ts
export function expandEvents(
  events: CalendarEvent[],
  rangeStart: string,   // YYYY-MM-DD inclusive
  rangeEnd: string      // YYYY-MM-DD inclusive
): CalendarEvent[]
```

Logic:
- For each event with `repeat !== 'none'`, generate virtual instances within `[rangeStart, rangeEnd]`
- Virtual instances get `id: \`${event.id}-${date}\`` (never written to store, only for rendering)
- `repeat: 'daily'` — one instance per day in range
- `repeat: 'weekly'` — instances on matching weekday within range
- `repeat: 'monthly'` — instance on matching day-of-month within range (skip if day > days in month)
- Original event date is included as a real instance (not virtual); skip generating a virtual duplicate for it
- Cap expansion at 365 instances per event to prevent runaway loops

**Integration:**
- `components/calendar/MonthView.tsx`: call `expandEvents(events, firstDayOfMonth, lastDayOfMonth)` instead of using raw `events`
- `components/calendar/DayView.tsx`: call `expandEvents(events, selectedDate, selectedDate)`
- `components/calendar/WeekView.tsx` (new, see 3.2): call `expandEvents(events, weekStart, weekEnd)`

### 3.2 Week View

**New file: `components/calendar/WeekView.tsx`**

Layout:
- 7 columns (Mon–Sun), horizontal scroll disabled, each column `flex-1` within `max-w-[430px]`
- Time axis on left: 6am–11pm in 30-minute slots, `text-[9px] font-mono text-[#AEAEB2]`
- Today's column: background `bg-[#1560FF]/[0.04]`, date number in `text-[#1560FF] font-bold`
- Events rendered as absolutely positioned blocks within their column: `top` and `height` calculated from start/end time against the 6am baseline
- Minimum event block height: 28px (so short events are still tappable)
- Event block tapped: opens a read-only detail view (title, time, notes) — editing is out of scope
- Mobile: entire grid is `overflow-x-hidden`; if 7 columns are too narrow, show Mon–Sun labels as 3-letter abbreviations with the date number below
- Colors: use `event.color` as the block background at 90% opacity with white text

**Integration — `app/(app)/calendar/page.tsx`:**
```tsx
{view === 'month' && <MonthView />}
{view === 'week' && <WeekView />}
{view === 'day' && <DayView />}
```

The "Week" button in `CalendarHeader` already sets `view: 'week'` — no change needed there.

### 3.3 Today View on Planner

**Fix — `app/(app)/planner/page.tsx`:**

Add a segmented toggle at the top of the page:
```
[ Today ]  [ All ]
```
- Default: `Today`
- State: local `useState` — not persisted, resets to `Today` on page load
- Mobile: full-width segmented control, `rounded-2xl bg-[#F5F5F7]`, active pill in white with shadow (same pattern as FoodSearch mode toggle)

**"Today" filter logic:**
- **Personal tasks:** show if `!t.done && (t.due === today || !t.due)`
- **CRM tasks:** already filter to `done: false` from Supabase; add client-side filter for `t.due <= today` (overdue + today)
- **Routines:** show all (routines reset daily anyway)
- **Weekly Goals:** show all (not day-specific)
- **Long-Term Goals:** show all (not day-specific)
- **SchedulePlanner button:** always visible in both views

**"All" view:** unchanged from current behavior — shows everything.

### 3.4 `resetDailyTasks` Auto-Call

**Problem:** Personal tasks with `repeat: 'daily'` are supposed to reset each morning but nothing triggers it.

**Fix — `store/planner.ts`:**
- Add `lastResetDate: string` field (default empty string)
- Add `resetDailyTasksIfNeeded()` action: checks `lastResetDate !== today`, if stale calls existing `resetDailyTasks()` logic and updates `lastResetDate`

**Fix — `app/(app)/planner/page.tsx`:**
- `useEffect` on mount: call `resetDailyTasksIfNeeded()`

---

## Phase 4 — Intelligence Layer

### 4.1 Budget Coach

**New file: `app/api/budget-coach/route.ts`**

POST endpoint. Accepts:
```ts
{
  income: number
  transactions: Transaction[]
  categories: BudgetCategory[]
  recurringExpenses: RecurringExpense[]
}
```

Returns streamed text (not JSON — narrative is more natural here):
- Use `ReadableStream` / Vercel streaming response
- Stream the analysis as plain text, structured with newline separators

System prompt:
```
You are a personal finance coach. Analyze this month's spending and give specific, actionable advice.
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
- Compare spent vs cap for each category
```

Temperature: 0.3. Max tokens: 512.

**Integration — `app/(app)/budget/page.tsx`:**
- Add a "Get Advice" button in the page header (beside the existing `+` button), using a `Sparkles` icon
- Tapping opens a BottomSheet titled "Budget Coach"
- Shows a loading shimmer while streaming, then renders the streamed text progressively
- Footer: "Close" button (no action button needed)
- Mobile: text rendered in `text-sm text-[#1D1D1F] leading-relaxed`, section labels (`HEALTH:`, `ANOMALIES:`, `ACTIONS:`) bolded

### 4.2 CRM Deal Coach

**New file: `app/api/crm-coach/route.ts`**

POST endpoint. Accepts:
```ts
{
  name: string
  business: string
  stage: string
  service: string
  value: number
  notes: string
  daysSinceContact: number
}
```

Returns JSON:
```ts
{
  action: string         // short next action
  urgency: 'high' | 'medium' | 'low'
  message_draft: string  // ready-to-send message
  reason: string         // why this action now
}
```

System prompt:
```
You are a B2B sales coach for a digital agency offering web development, growth marketing, and foundation packages.
Given a lead's status, recommend the single best next action.
Return ONLY valid JSON: { "action": "...", "urgency": "high|medium|low", "message_draft": "...", "reason": "..." }
Rules:
- action: under 10 words, imperative
- message_draft: ready to send, conversational, under 60 words, no placeholders
- urgency: high if 5+ days since contact or deal is closing, medium otherwise, low if new lead
- reason: one sentence explaining timing
```

Temperature: 0.2. Max tokens: 300.

**Integration — `components/planner/CRMTaskList.tsx`:**
- Add a small "Coach" chip (using `Sparkles` icon, `text-[10px]`) on each task card that has a non-empty `related` field
- Tapping the chip fetches `/api/crm-coach` with `{ name: task.related, business: '', stage: task.priority, service: '', value: 0, notes: '', daysSinceContact: 0 }` — `related` is the most useful field available from the task record; the API prompt handles sparse data gracefully
- Opens a BottomSheet with: the `action` bolded, `reason` in gray below, full `message_draft` in a styled quote block, and a "Copy Message" button in the footer
- Loading: spinner on the chip while fetching
- Mobile: "Copy Message" uses `navigator.clipboard.writeText(message_draft)` with a success toast

### 4.3 Richer Schedule Context

**Problem:** `/api/schedule` doesn't know about existing calendar events, so it double-books slots.

**Fix — `components/planner/SchedulePlanner.tsx`:**
- Before the `fetch('/api/schedule', ...)` call, read `useCalendarStore().events`
- Filter to events on `selectedDate` with a `time` set
- Pass as `existingEvents: { title, time, duration }[]` in the request body

**Fix — `app/api/schedule/route.ts`:**
- Destructure `existingEvents` from the request body
- If present, prepend to `userContent`:
  ```
  Existing calendar events (do NOT schedule over these):
  ${existingEvents.map(e => `- ${e.time}: ${e.title}`).join('\n')}
  ```

### 4.4 Per-Day Exercise Completion

**Problem:** `toggleExercise` permanently mutates the `done` field on the workout schedule template. Yesterday's completed exercises appear checked today.

**Fix — `store/fitness.ts`:**
- Add `exerciseLog: Record<string, string[]>` — keys are `YYYY-MM-DD`, values are arrays of exercise names completed that day. Default: `{}`
- Add `toggleExerciseLog(day: string, exName: string)` action: toggles the exercise name in/out of `exerciseLog[today]`. Does not touch `workoutSchedule`.
- Add `isExerciseDone(day: string, exName: string): boolean` selector: checks `exerciseLog[today]?.includes(exName) ?? false`
- Remove `toggleExercise` mutation of `workoutSchedule[].exercises[].done` — the schedule is now a read-only template
- Keep `addExercise` / `removeExercise` / `setDayType` as-is (they modify the template, which is correct)

**Fix — `components/fitness/GymChecklist.tsx`:**
- Replace `exercise.done` reads with `isExerciseDone(day, exercise.name)` calls
- Replace `toggleExercise` calls with `toggleExerciseLog(day, exercise.name)` calls
- Update the "all done" streak detection introduced in Phase 2.2: replace `exercises.every(e => e.done)` with `exercises.every(e => isExerciseDone(selectedDay.day, e.name))`

### 4.5 `calorieGoal` Unification

**Problem:** Both `useFitnessStore` and `useSettingsStore` have `calorieGoal`. They start identical but silently diverge.

**Fix — `store/fitness.ts`:**
- Remove `calorieGoal` field and `setCalorieGoal` action

**Fix — all consumers:**
- `components/fitness/CalorieRing.tsx`: replace `useFitnessStore()` calorieGoal read with `useSettingsStore().calorieGoal`
- `app/(app)/fitness/page.tsx`: no direct calorieGoal read — no change needed
- `components/fitness/FoodSearch.tsx`: does not read calorieGoal — no change needed

**Settings form:** already writes to `useSettingsStore` — no change needed.

**Migration note:** On first load after this change, users who had a non-default `calorieGoal` in `useFitnessStore` will lose it. The Zustand persist key for fitness will drop the field on next read. This is acceptable — they set it in Settings once and it's correct going forward.

### 4.6 Budget Category Management

**Problem:** `addCategory` exists in the store but has no UI. Users are stuck with 5 hardcoded categories.

**New component: `components/budget/ManageCategories.tsx`**

- Renders below `RecurringExpenses` on the Budget page
- Header: "Categories" label + `+` button
- List: existing categories as rows showing colored dot + name + cap amount + trash icon
- Trash: disabled (grayed out + no-op) if any transaction uses that category; otherwise calls `removeCategory` (add this action to the store)
- `+` button: opens a BottomSheet titled "Add Category"
  - Input: category name (text, `autoCapitalize="words"`)
  - Input: monthly cap (number, `inputMode="numeric"`)
  - Color picker: 6 swatches from the existing palette (`#1560FF`, `#00d084`, `#ffb547`, `#a855f7`, `#ff4d6a`, `#00d4ff`)
  - Footer: "Add Category" button, disabled until name is filled
- Mobile: color swatches are `w-10 h-10` each (44pt), arranged in a single row with `gap-3`

**Fix — `store/budget.ts`:**
- Add `removeCategory(id: string)` action: filters `categories` array, guarded in the component before calling

---

## Cross-Cutting: Mobile-First Rules

These apply to every change in every phase:

| Rule | Enforcement |
|------|-------------|
| Action buttons in BottomSheets | Always in `footer` prop, never in scrollable content |
| New inputs | Always include `inputMode`, `enterKeyHint`, and `autoCapitalize` where applicable |
| Icon-only buttons | Minimum `p-2` padding for 44pt touch target |
| Page containers | Minimum `pb-24` bottom padding |
| Loading states | Skeleton shimmer for any card that fetches data; never blank |
| Streaming AI | Progressive render — show text as it arrives, not all at once |
| Error states | Silent hide for non-critical AI cards (Morning Brief); toast for user-triggered actions |

---

## File Change Summary

### New Files
- `app/api/morning-brief/route.ts`
- `app/api/budget-coach/route.ts`
- `app/api/crm-coach/route.ts`
- `lib/calendar-utils.ts`
- `components/home/MorningBrief.tsx`
- `components/calendar/WeekView.tsx`
- `components/budget/ManageCategories.tsx`

### Modified Files
- `store/fitness.ts` — meal date scoping, per-day exercise log, remove calorieGoal, streak guard, lastStreakDate
- `store/planner.ts` — add lastResetDate, resetDailyTasksIfNeeded
- `store/budget.ts` — add removeCategory
- `store/settings.ts` — calorieGoal stays here (no change)
- `app/api/ai-chat/route.ts` — move today inside handler, add crm_note/crm_lead types
- `app/api/schedule/route.ts` — accept and inject existingEvents
- `app/(app)/home/page.tsx` — replace StreakTracker with MorningBrief
- `app/(app)/budget/page.tsx` — month rollover on mount, add ManageCategories, add Budget Coach button, pb-24
- `app/(app)/fitness/page.tsx` — pb-24
- `app/(app)/calendar/page.tsx` — add WeekView render, pb-24
- `app/(app)/planner/page.tsx` — Today/All toggle, resetDailyTasksIfNeeded on mount
- `components/home/AIChatInput.tsx` — voiceInput gate, crm_note/crm_lead cases
- `components/fitness/CalorieRing.tsx` — button to footer, delete touch target, read calorieGoal from settings
- `components/fitness/GymChecklist.tsx` — use exerciseLog instead of done field, streak trigger
- `components/fitness/WorkoutSchedule.tsx` — pass day to GymChecklist for exerciseLog key
- `components/calendar/MonthView.tsx` — use expandEvents
- `components/calendar/DayView.tsx` — use expandEvents
- `components/planner/CRMTaskList.tsx` — add Coach chip + BottomSheet
- `components/planner/SchedulePlanner.tsx` — fix lockIn() duplicates, pass existingEvents
- `components/nav/BottomNav.tsx` — refactor Settings into tabs array
- `public/manifest.json` — fix theme_color
- `app/layout.tsx` — fix viewport themeColor
- `vercel.json` — remove dead cron

### Deleted Files
- `lib/smart-parser.ts`
- `lib/parser-rules.ts`
- `components/home/DailyOverviewCard.tsx`
- `components/home/StreakTracker.tsx` (replaced by MorningBrief)

---

## Out of Scope

- Push notification server delivery (subscription persistence + webpush.sendNotification) — deferred
- CRM leads/clients/invoices in-app view — lives in separate DFG CRM
- Supabase anon key moved to env vars — low risk, separate cleanup PR
- Event editing from Week View — read-only for now
- Weekly goals auto-archive — out of scope
