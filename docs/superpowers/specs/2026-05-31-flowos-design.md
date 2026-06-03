# FlowOS — Design Spec
**Date:** 2026-05-31  
**Author:** Yandel / Digital Flow Global  
**Status:** Approved for implementation

---

## 1. Overview

FlowOS is a mobile-first, iOS-optimized Progressive Web App that lives on Yandel's iPhone home screen and serves as the personal operating system for running Digital Flow Global. It combines personal productivity (tasks, calendar, budget, fitness) with a live DFG CRM intelligence layer powered by Claude AI. Every day at 6 PM EST it auto-generates a time-blocked mission briefing for the next day using live Supabase CRM data + personal state + a free-form brain dump.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | SSR, API routes, file-based routing |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first |
| Animation | Framer Motion | Spring physics, iOS feel |
| State | Zustand (persisted) | Lightweight global store |
| PWA | Serwist | App Router native, full offline |
| AI | Anthropic SDK (`claude-sonnet-4-6`) | Gameplan generation |
| Database | @supabase/supabase-js v2 | Direct CRM reads/writes |
| Charts | Recharts | Mobile-friendly, React-native |
| Drag | @dnd-kit/core | Touch-native, iOS-safe sortable |
| Local storage | localStorage + `idb` (IndexedDB wrapper) | Persistent data, gameplan history |
| Notifications | Web Push API + Notification API | Alarms, reminders |
| Voice | Web Speech API | Brain dump input |
| Fonts | Syne (display) + Space Grotesk (body) + JetBrains Mono (data) | Match DFG CRM |

---

## 3. Project Structure

```
flow-os/
├── app/
│   ├── layout.tsx                  # Root layout, font imports, PWA meta
│   ├── page.tsx                    # Redirects to /home
│   ├── (app)/                      # Shell with bottom nav
│   │   ├── layout.tsx              # BottomNav + SafeArea wrapper
│   │   ├── home/page.tsx           # Tab 1: Dashboard
│   │   ├── planner/page.tsx        # Tab 2: Tasks + Goals
│   │   ├── calendar/page.tsx       # Tab 3: Calendar + Reminders
│   │   ├── budget/page.tsx         # Tab 4: Budget Tracker
│   │   ├── fitness/page.tsx        # Tab 5: Fitness Hub
│   │   └── command/page.tsx        # Tab 6: AI Command
│   └── api/
│       ├── gameplan/route.ts       # Server route — Anthropic API call
│       ├── push/subscribe/route.ts # Save push subscription
│       └── cron/gameplan-notify/route.ts  # Vercel cron — 6 PM EST push
├── components/
│   ├── ui/                         # Reusable primitives (GlassCard, Badge, etc.)
│   ├── nav/BottomNav.tsx
│   ├── home/                       # Dashboard components
│   ├── planner/                    # Task + goal components
│   ├── calendar/                   # Calendar views
│   ├── budget/                     # Budget components
│   ├── fitness/                    # Fitness components
│   └── command/                    # Gameplan components
├── lib/
│   ├── supabase.ts                 # Supabase client + fromSnake/toSnake helpers
│   ├── anthropic.ts                # Claude API wrapper (server-only)
│   ├── db.ts                       # IndexedDB via idb (gameplan history, brain dump)
│   ├── notifications.ts            # Push + local notification helpers
│   ├── gameplan.ts                 # Context compiler for Claude prompt
│   └── sw-scheduler.ts             # 6 PM EST trigger logic
├── store/
│   ├── index.ts                    # Root store export
│   ├── planner.ts                  # Tasks + goals state
│   ├── calendar.ts                 # Events + reminders state
│   ├── budget.ts                   # Budget + transactions state
│   ├── fitness.ts                  # Weight, workouts, calories state
│   ├── command.ts                  # Gameplan + CRM context state
│   └── settings.ts                 # User settings state
├── public/
│   ├── sw.ts                       # Serwist service worker
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # PWA icons (192, 512, maskable)
├── styles/
│   └── globals.css                 # CSS variables + base styles
└── next.config.ts                  # Serwist integration
```

---

## 4. Design System

### Colors (exact match to DFG CRM)
```css
--bg-deep:      #020203
--bg-base:      #07080F
--bg-elevated:  #0A0C18
--surface:      rgba(255,255,255,0.04)
--border:       rgba(255,255,255,0.08)
--fg:           #edeef2
--fg-muted:     #8a8f9a

/* Accents */
--blue:         #1560FF   /* CRM elements, primary CTAs */
--cyan:         #00d4ff   /* Data, sequences */
--green:        #00d084   /* Success, clients, fitness */
--amber:        #ffb547   /* Warnings, meetings, personal */
--purple:       #a855f7   /* Tasks, focus blocks */
--red:          #ff4d6a   /* Overdue, urgent */
```

### Typography
- **Display/headings:** Syne 700/800
- **Body:** Space Grotesk 300/400/500/600
- **Monospace (times, data):** JetBrains Mono

### Glass Cards
```css
backdrop-filter: blur(12px);
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
box-shadow: 0 0 24px rgba([accent],0.12) inset;
border-radius: 16px;
```

### Motion
- All transitions: spring physics (`stiffness: 300, damping: 30`)
- Tab crossfade: `opacity` + `scale(0.98 → 1)`, 200ms
- Cards scale on press: `scale(0.96)` via `whileTap`
- Bottom sheets: slide up from y(100%) with spring
- Gameplan load: staggered reveal (0.08s delay per block)
- Typewriter: character-by-character on greeting
- Active time block: pulsing glow keyframe animation

### Mobile Constraints
- `max-width: 430px`, centered on larger screens
- `padding-bottom: env(safe-area-inset-bottom)` for home bar
- `padding-top: env(safe-area-inset-top)` for notch
- PWA `display: standalone`, `theme-color: #07080F`
- Dark mode only — no light mode toggle

---

## 5. Supabase Integration

### Client Setup (`lib/supabase.ts`)
```typescript
const SUPABASE_URL = 'https://cmntmktwcrkqryuaocui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGci...' // hardcoded public anon key

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Snake/Camel Helpers
- `fromSnake(obj)` — converts all snake_case keys to camelCase for JS use
- `toSnake(obj)` — converts all camelCase keys to snake_case for DB writes
- Applied to all Supabase reads and writes throughout the app

### Tables Used
| Table | Operations |
|---|---|
| `leads` | READ (dashboard stats, gameplan), UPDATE (stage changes from gameplan) |
| `clients` | READ (dashboard MRR, gameplan context) |
| `tasks` | READ (planner CRM tasks), INSERT (gameplan write-back) |
| `activity` | READ (recent 48h for gameplan), INSERT (notes from gameplan) |
| `sequences` | READ (active sequences for gameplan) |
| `invoices` | READ (pending/overdue for dashboard + gameplan) |
| `campaigns` | READ (future dashboard stat) |
| `dialer_log` | READ (future Command context) |

---

## 6. Module Specs

### Tab 1 — Dashboard (Home)
**Purpose:** Single-glance daily status.

**Components:**
- `DailyOverviewCard` — tasks due today, calories remaining, next alarm, weekly budget left
- `CRMStatsGrid` — 4 glowing data pills fetched live from Supabase on mount:
  - Open leads count
  - Active clients + combined MRR (sum of `monthly` column)
  - Tasks due today (from `tasks` table where `done=false` and `due=today`)
  - Overdue invoice total (sum of `amount` where `status='Overdue'`)
- `StreakTracker` — days hitting all personal goals, stored in localStorage
- `MotivationalStatus` — dynamic string based on time of day + streak
- `GameplanPreviewCard` — shows tomorrow's gameplan summary if already generated (from IndexedDB)
- `QuickAddFAB` — floating action button, bottom-right, opens bottom sheet to add to any module

**Data:** Supabase queries run on mount with `useEffect`, cached in Zustand for session.

---

### Tab 2 — Planner (Tasks + Goals)
**Purpose:** Personal task management + CRM task mirror.

**Sections:**
1. **CRM Tasks** — pulled from Supabase `tasks` table, displayed with `DFG` badge, lead/client name, priority color, due date. Pull-to-refresh re-fetches from Supabase.
2. **Personal Tasks** — stored in Zustand (persisted to localStorage). Checkbox to complete, swipe left to delete, tap to edit.
3. **Weekly Goals** — 5 mandatory goals with progress bars (e.g., "Call 20 new leads", "Log 5 workouts"). Locked status until complete. Overdue goals roll to next week marked red. Stored in Zustand.

**Recurring tasks:** Personal tasks support `repeat: 'daily' | 'weekly' | 'none'`. Daily tasks auto-reset at midnight (checked on app mount).

---

### Tab 3 — Calendar + Reminders
**Purpose:** Unified time view of personal events + CRM meetings + gameplan blocks.

**Views:** Month → Week → Day, swipeable horizontally via Framer Motion drag.

**Event layers (color-coded):**
- Personal events: user-defined color tag
- CRM meetings: electric blue (#1560FF), sourced from `leads` where `meeting_date` is set
- Gameplan blocks: type color (see Command tab)
- Alarms: amber (#ffb547)

**Add event flow:** FAB → bottom sheet → title, date, time, repeat, color, notification toggle.

**Notifications:** Each reminder stored in Zustand + IndexedDB. On alarm time, `notifications.ts` fires a local notification via Notification API. Service worker handles delivery when app is backgrounded.

---

### Tab 4 — Budget Tracker
**Purpose:** Personal monthly budget with category tracking.

**Structure:**
- Monthly income input (stored in Zustand)
- Expense categories: Rent, Food, Gas, Subscriptions, Misc + unlimited custom categories
- Add transaction: amount, category, note, date — stored in Zustand (persisted)
- `SpendingBreakdown` — horizontal bar chart via Recharts, one bar per category vs budget cap
- `BalanceDisplay` — large remaining balance figure, prominent, color shifts red when <20% left
- Per-category budget goals with 80% push notification trigger
- Monthly archive on reset (old month moved to history array in store)

---

### Tab 5 — Fitness Hub
**Purpose:** Weight tracking + workout scheduling + calorie logging.

**Components:**
- `WeightProgress` — current weight, goal weight, line chart (Recharts) showing last 30 weigh-ins
- `WorkoutSchedule` — 7-day grid, each day has type (Push/Pull/Legs/Rest/Cardio/custom). Tap day → gym checklist with exercises, sets, reps, weight.
- `CalorieTracker` — daily goal (from settings), meal log with name + calories + macros (P/C/F). Ring indicator showing remaining calories.
- `WorkoutStreak` — consecutive days with a logged workout session.

**Data:** All stored in Zustand (persisted). Weigh-in history capped at 90 entries.

---

### Tab 6 — Command (AI Gameplan)
**Purpose:** Intelligence layer. Auto-generates tomorrow's time-blocked mission briefing.

#### 6a. Brain Dump Input
- Always-visible card at top of Command tab
- Textarea + mic button (Web Speech API for voice-to-text)
- Saved to IndexedDB as `brainDump.pending`
- Auto-cleared after gameplan generation, archived to `brainDump.history[]`

#### 6b. Automated 6 PM EST Trigger
iOS Safari does not support `periodicsync` — service workers cannot wake themselves on a schedule when the app is closed. The trigger uses a two-layer approach:

**Layer 1 — Vercel Cron (reliable, works when app is closed):**
- `/api/cron/gameplan-notify` route, triggered by Vercel cron at `0 23 * * *` UTC (= 6 PM EST, 7 PM EDT — stored as EST, adjusted for DST)
- Route sends a Web Push notification via VAPID to registered subscribers: "FlowOS is building tomorrow's gameplan..."
- User taps notification → app opens → Layer 2 fires

**Layer 2 — On-Open Check (runs every time app opens/foregrounds):**
- App layout checks: is it past 6 PM local time? Does `gameplans[tomorrow]` exist in IndexedDB?
- If both true → auto-starts generation immediately without user input
- Progress indicator shown in Command tab header during generation
- On completion: local notification "Tomorrow's gameplan is ready — tap to review"

**Layer 3 — Manual Trigger (fallback):**
- "Generate Now" button always visible in Command tab
- Labeled "Generate Tomorrow's Gameplan" with last-generated timestamp

**VAPID keys** stored as env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Push subscriptions stored in Supabase `push_subscriptions` table or localStorage (single-user, localStorage is sufficient).

#### 6c. Claude API Route (`/api/gameplan/route.ts`)
- POST endpoint, server-only, reads `ANTHROPIC_API_KEY` from env
- Accepts full context JSON from client
- System prompt: exact string with Yandel's name and DFG context
- User message: serialized context object (see prompt schema in original spec)
- Calls `anthropic.messages.create` with `claude-sonnet-4-6`
- Parses response, validates JSON schema, returns to client
- Error: returns `{ error: string, raw: string }` for debugging

#### 6d. Context Compiler (`lib/gameplan.ts`)
Pulls at generation time:
1. `tasks` — where `done=false`, ordered by `due` asc
2. `leads` — where stage NOT IN ('Won','Lost'), prioritized by stage
3. `leads` — where `date` = today or yesterday (new leads)
4. `activity` — where `created_at >= now - 48h`
5. `clients` — where `status = 'Active'`
6. `invoices` — where `status IN ('Pending','Overdue')`
7. `sequences` — where `status = 'Active'`

Plus from Zustand: personal tasks, weekly goals, tomorrow's workout, calorie goal, calories logged today, weekly budget remaining.

#### 6e. Gameplan Review UI
- Full-screen "mission briefing" view activated when gameplan exists
- `GreetingHero` — typewriter animation on `greeting` field, dark glass hero card
- `DailyFocusCard` — bold daily focus statement
- `CRMSnapshot` — glowing data pills (open leads, MRR, meetings tomorrow)
- `WinsGrid` — 3 checkable achievement cards
- `PriorityTimeline` — vertical scrollable list of `priority_blocks`:
  - Each block: glass card with type-color glow, time badge (JetBrains Mono), type icon, title, description
  - CRM blocks show lead/client name + action type chip
  - Alarm toggle (default on if `set_alarm: true`)
  - Drag handle — `@dnd-kit/core` SortableContext for reordering
- `ConfirmCTA` — "Confirm & Set Alarms" sticky bottom button
- `SyncCTA` — "Sync to DFG CRM" button appears after confirm

#### 6f. Alarm Scheduling (on Confirm)
- For each block with `set_alarm: true`: schedule local notification at `blockTime - alarm_minutes_before`
- Schedule 7 AM morning briefing push
- All alarms stored in IndexedDB + appear in Calendar tab
- Toast: "9 reminders set for tomorrow ✓"

#### 6g. CRM Write-Back (on Sync)
Iterates `crm_writes` array from Claude response:
- `table: 'tasks', action: 'insert'` → `sb.from('tasks').insert(toSnake(data))`
- `table: 'activity', action: 'insert'` → `sb.from('activity').insert(toSnake(data))`
- `table: 'leads', action: 'update'` → `sb.from('leads').update(toSnake(data)).eq('id', data.id)`
- Shows sync result card: "Synced: X tasks · Y notes · Z stage updates"
- Failed writes shown in retry queue

#### 6h. Evening Review (9 PM default)
- Push notification: "DFG evening check-in — how'd today go?"
- Quick review: mark each block complete/incomplete
- Brief Claude summary (separate lightweight API call): performance insight + tomorrow prep note
- Completion data stored in IndexedDB with gameplan record

#### 6i. Gameplan History
- Last 14 days stored in IndexedDB (`gameplans[]` array keyed by date)
- History section at bottom of Command tab: date, completion %, daily focus preview

---

## 7. Notifications System

| Trigger | Time | Message |
|---|---|---|
| Gameplan building | 6:00 PM EST | "FlowOS is building tomorrow's gameplan..." |
| Gameplan ready | ~6:05 PM EST | "Tomorrow's gameplan is ready — tap to review" |
| Morning briefing | 7:00 AM (configurable) | "Good morning — first block: [title] at [time]" |
| Block alarm | N min before block | "[alarm_label]" |
| Budget 80% | On transaction add | "You've used 80% of your [category] budget" |
| Weekly goals | 9:00 AM if incomplete | "Weekly goals need attention — tap to review" |
| Overdue invoice | On app open | "Overdue invoice: [client] — $[amount]" |
| Evening review | 9:00 PM (configurable) | "DFG evening check-in — how'd today go?" |

All notifications: tap opens app to relevant tab.

---

## 8. Settings

| Setting | Default | Storage |
|---|---|---|
| User name | "Yandel" | Zustand/localStorage |
| Gameplan time | 6:00 PM EST | Zustand |
| Morning briefing time | 7:00 AM | Zustand |
| Evening review time | 9:00 PM | Zustand |
| Auto-alarm toggle | On | Zustand |
| Auto-CRM sync | Require approval | Zustand |
| Voice input | On | Zustand |
| Calorie goal | 2000 | Zustand |
| Weekly budget cap | User-set | Zustand |
| Notification permission | — | Prompt on first launch |
| Supabase test | — | Button → test query |
| Data export | — | Button → JSON download |

---

## 9. PWA Configuration

### Manifest (`public/manifest.json`)
```json
{
  "name": "FlowOS",
  "short_name": "FlowOS",
  "display": "standalone",
  "background_color": "#07080F",
  "theme_color": "#07080F",
  "start_url": "/home",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "purpose": "maskable" }
  ]
}
```

### Serwist (`public/sw.ts`)
- Precaches all Next.js static assets
- Runtime caches: Supabase API responses (network-first, 5m TTL), Google Fonts (cache-first)
- Background sync: queues failed Supabase writes for retry on reconnect
- Push event listener: displays notifications
- Periodic check: 6 PM EST gameplan trigger logic

### Offline Behavior
- Dashboard: shows last cached CRM stats with "Offline" badge
- Planner: fully functional from Zustand
- Calendar: fully functional from Zustand
- Budget: fully functional from Zustand
- Fitness: fully functional from Zustand
- Command: shows cached gameplan; generation disabled offline with message

---

## 10. Environment Variables

```env
# Required (server-only — never exposed to client)
ANTHROPIC_API_KEY=sk-ant-...
VAPID_PUBLIC_KEY=...    # generated via web-push CLI
VAPID_PRIVATE_KEY=...   # generated via web-push CLI
VAPID_SUBJECT=mailto:yandel@digitalflowglobal.com

# Supabase keys are hardcoded in lib/supabase.ts (public anon keys, same as CRM)
```

---

## 11. Deployment

- Platform: Vercel
- Build command: `next build`
- Root directory: `flow-os/`
- Environment variables: `ANTHROPIC_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` set in Vercel dashboard
- Domain: custom or `flow-os.vercel.app`
- No edge functions — standard Fluid Compute for all `/api/*` routes
- Vercel cron: `vercel.json` configures `/api/cron/gameplan-notify` at `0 23 * * *` (UTC = 6 PM EST)

---

## 12. Out of Scope (Phase 2+)

- Notion auto-capture from Claude sessions (separate project — chip queued)
- CRM file optimization (chip queued)
- Multi-user support
- FlowOS ↔ Notion two-way sync
- Android/desktop optimization (iPhone-first)
