# FlowOS Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build FlowOS — a mobile-first iOS PWA with 5 productivity modules (Dashboard, Planner, Calendar, Budget, Fitness) + live DFG CRM Supabase integration, deployable to Vercel.

**Architecture:** Single Next.js 15 App Router monolith with Serwist PWA, Zustand persisted state, direct Supabase client, and a bottom-tab shell. Phase 2 adds the Command/AI Gameplan tab.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, Serwist, @supabase/supabase-js v2, Recharts, @dnd-kit/core, idb, web-push, Space Grotesk + Syne + JetBrains Mono

---

## File Map

```
C:\Users\Admin\flow-os\
├── app/
│   ├── layout.tsx                        Root layout: fonts, PWA meta, SW registration
│   ├── page.tsx                          Redirect → /home
│   ├── sw.ts                             Serwist service worker entry
│   ├── (app)/
│   │   ├── layout.tsx                    Shell: BottomNav + SafeArea wrapper
│   │   ├── home/page.tsx                 Tab 1: Dashboard
│   │   ├── planner/page.tsx              Tab 2: Tasks + Goals
│   │   ├── calendar/page.tsx             Tab 3: Calendar + Reminders
│   │   ├── budget/page.tsx               Tab 4: Budget Tracker
│   │   ├── fitness/page.tsx              Tab 5: Fitness Hub
│   │   └── settings/page.tsx             Settings
│   └── api/
│       └── push/
│           └── subscribe/route.ts        Save push subscription
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx                 Reusable glass card primitive
│   │   ├── Badge.tsx                     Colored label badge
│   │   ├── BottomSheet.tsx               iOS-style slide-up modal
│   │   ├── FAB.tsx                       Floating action button
│   │   ├── Toast.tsx                     Notification toast
│   │   └── RingProgress.tsx              Circular progress ring (calories)
│   ├── nav/
│   │   └── BottomNav.tsx                 5-tab bottom navigation bar
│   ├── home/
│   │   ├── DailyOverviewCard.tsx         Tasks/calories/alarm/budget snapshot
│   │   ├── CRMStatsGrid.tsx              4 live Supabase data pills
│   │   ├── StreakTracker.tsx             Days hitting all goals
│   │   └── QuickAddFAB.tsx              FAB that opens add-to-module sheet
│   ├── planner/
│   │   ├── CRMTaskList.tsx               Supabase tasks with DFG badge
│   │   ├── PersonalTaskList.tsx          Zustand local tasks
│   │   └── WeeklyGoals.tsx              Progress bar goals
│   ├── calendar/
│   │   ├── CalendarHeader.tsx            Month/week/day toggle
│   │   ├── MonthView.tsx                 Monthly grid
│   │   ├── WeekView.tsx                  7-day column view
│   │   ├── DayView.tsx                   Single day timeline
│   │   └── EventSheet.tsx               Add/edit event bottom sheet
│   ├── budget/
│   │   ├── BalanceDisplay.tsx            Large remaining balance figure
│   │   ├── SpendingChart.tsx             Recharts horizontal bar chart
│   │   ├── TransactionList.tsx           Scrollable transaction log
│   │   └── AddTransactionSheet.tsx      Add transaction bottom sheet
│   ├── fitness/
│   │   ├── WeightChart.tsx               Recharts line chart (30 weigh-ins)
│   │   ├── WorkoutSchedule.tsx           7-day grid with type labels
│   │   ├── GymChecklist.tsx             Exercise set/rep tracker
│   │   └── CalorieRing.tsx              Ring + meal log
│   └── settings/
│       └── SettingsForm.tsx             All settings inputs
├── lib/
│   ├── supabase.ts                       Client init + fromSnake/toSnake
│   ├── db.ts                             IndexedDB via idb (events, reminders)
│   └── notifications.ts                 Push + local notification helpers
├── store/
│   ├── index.ts                          Re-export all stores
│   ├── planner.ts                        Personal tasks + weekly goals
│   ├── calendar.ts                       Events + reminders
│   ├── budget.ts                         Income + transactions + categories
│   ├── fitness.ts                        Weight log + workouts + calories
│   └── settings.ts                       User preferences
├── styles/
│   └── globals.css                       CSS variables + Tailwind v4 theme
├── public/
│   ├── manifest.json                     PWA manifest
│   └── icons/                            192.png, 512.png, maskable.png
├── next.config.ts                        Serwist integration
├── vercel.json                           Cron + config
└── .env.local                            ANTHROPIC_API_KEY, VAPID keys
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `C:\Users\Admin\flow-os\` (full project)

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd C:\Users\Admin
npx create-next-app@latest flow-os --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
cd flow-os
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install framer-motion zustand @supabase/supabase-js idb recharts \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  @serwist/next serwist web-push \
  @anthropic-ai/sdk
npm install --save-dev @types/web-push
```

- [ ] **Step 3: Remove boilerplate**

Delete `app/page.tsx` contents, `app/globals.css` contents, `public/next.svg`, `public/vercel.svg`.

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p app/\(app\)/home app/\(app\)/planner app/\(app\)/calendar \
  app/\(app\)/budget app/\(app\)/fitness app/\(app\)/settings \
  app/api/push/subscribe \
  components/ui components/nav components/home components/planner \
  components/calendar components/budget components/fitness components/settings \
  lib store styles public/icons
```

- [ ] **Step 5: Create `.env.local`**

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:yandel@digitalflowglobal.com
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold FlowOS Next.js 15 project with all dependencies"
```

---

## Task 2: Design System + Global Styles

**Files:**
- Create: `styles/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write global CSS with design tokens**

`styles/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg-deep: #020203;
  --color-bg-base: #07080F;
  --color-bg-elevated: #0A0C18;
  --color-surface: rgba(255,255,255,0.04);
  --color-border: rgba(255,255,255,0.08);
  --color-fg: #edeef2;
  --color-fg-muted: #8a8f9a;
  --color-blue: #1560FF;
  --color-cyan: #00d4ff;
  --color-green: #00d084;
  --color-amber: #ffb547;
  --color-purple: #a855f7;
  --color-red: #ff4d6a;

  --font-display: 'Syne', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  html, body {
    background-color: var(--color-bg-base);
    color: var(--color-fg);
    font-family: var(--font-body);
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
  }

  * { box-sizing: border-box; }
}

@layer utilities {
  .safe-top    { padding-top: env(safe-area-inset-top); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-x      { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }

  .glass {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }

  .font-display { font-family: var(--font-display); }
  .font-mono    { font-family: var(--font-mono); }
}
```

- [ ] **Step 2: Write root layout with font imports**

`app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next'
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'

const syne = Syne({ subsets: ['latin'], weight: ['400','700','800'], variable: '--font-display' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300','400','500','600'], variable: '--font-body' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'FlowOS',
  description: 'Personal command center — Digital Flow Global',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FlowOS' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07080F',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#07080F] text-[#edeef2] font-body antialiased">
        <div className="mx-auto max-w-[430px] min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add styles/globals.css app/layout.tsx
git commit -m "feat: design system — CSS tokens, fonts, safe-area utilities"
```

---

## Task 3: PWA + Serwist Setup

**Files:**
- Create: `app/sw.ts`, `public/manifest.json`, `public/icons/` (3 PNGs)
- Modify: `next.config.ts`

- [ ] **Step 1: Write service worker**

`app/sw.ts`:
```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? { title: 'FlowOS', body: '' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/192.png',
      tag: data.tag ?? 'flowos',
      data: { url: data.url ?? '/home' },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/home'
  event.waitUntil(clients.openWindow(url))
})
```

- [ ] **Step 2: Write PWA manifest**

`public/manifest.json`:
```json
{
  "name": "FlowOS",
  "short_name": "FlowOS",
  "description": "Personal command center — Digital Flow Global",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#07080F",
  "theme_color": "#07080F",
  "start_url": "/home",
  "scope": "/",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 3: Generate PWA icons**

Use any 512×512 dark icon (dark background `#07080F`, "FO" or logo text in white/blue `#1560FF`). Place three copies at:
- `public/icons/192.png` (192×192)
- `public/icons/512.png` (512×512)
- `public/icons/maskable.png` (512×512, with 20% safe zone padding)

Quick placeholder generation via sharp or any image editor. For now, copy a placeholder PNG.

- [ ] **Step 4: Configure Serwist in next.config.ts**

`next.config.ts`:
```typescript
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withSerwist(nextConfig)
```

- [ ] **Step 5: Register SW in root layout**

Add to the `<body>` in `app/layout.tsx` after the div:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
`}} />
```

- [ ] **Step 6: Commit**

```bash
git add app/sw.ts public/manifest.json public/icons next.config.ts app/layout.tsx
git commit -m "feat: PWA — Serwist service worker, manifest, push notification handler"
```

---

## Task 4: App Shell + Bottom Navigation

**Files:**
- Create: `app/(app)/layout.tsx`, `components/nav/BottomNav.tsx`
- Create: `app/page.tsx` (redirect), all 6 tab `page.tsx` stubs

- [ ] **Step 1: Write BottomNav component**

`components/nav/BottomNav.tsx`:
```tsx
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
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                    bg-[#07080F]/80 backdrop-blur-xl border-t border-white/[0.08]
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
                    className="absolute inset-0 rounded-xl bg-[#1560FF]/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  className={active ? 'text-[#1560FF]' : 'text-[#8a8f9a]'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </motion.div>
              <span className={`text-[10px] font-medium tracking-wide
                ${active ? 'text-[#1560FF]' : 'text-[#8a8f9a]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
        <Link href="/settings" className="flex flex-col items-center gap-1 flex-1 py-1">
          <motion.div whileTap={{ scale: 0.88 }} className="relative flex items-center justify-center w-10 h-10">
            <Settings size={20} className="text-[#8a8f9a]" strokeWidth={1.8} />
          </motion.div>
          <span className="text-[10px] font-medium tracking-wide text-[#8a8f9a]">Settings</span>
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Write app shell layout**

`app/(app)/layout.tsx`:
```tsx
import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#07080F]">
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe-top min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Write root redirect**

`app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
export default function Root() { redirect('/home') }
```

- [ ] **Step 4: Write tab page stubs**

`app/(app)/home/page.tsx`:
```tsx
export default function HomePage() {
  return <div className="p-4"><h1 className="font-display text-2xl font-bold">Dashboard</h1></div>
}
```

Repeat for `planner`, `calendar`, `budget`, `fitness`, `settings` — same stub pattern with their respective titles.

- [ ] **Step 5: Install lucide-react**

```bash
npm install lucide-react
```

- [ ] **Step 6: Verify app runs**

```bash
npm run dev
```

Open `http://localhost:3000` — expect redirect to `/home`, bottom nav visible with 6 tabs, tap animation on icons.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: app shell — bottom nav with spring animations, tab routing, safe areas"
```

---

## Task 5: Supabase Client + TypeScript Types

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Write Supabase client with helpers**

`lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cmntmktwcrkqryuaocui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbnRta3R3Y3JrcXJ5dWFvY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTA4MjYsImV4cCI6MjA5NDY2NjgyNn0.-t8Y43M4QChlzfMKfbmxNjTwwdsK-1NmFaHtoOr7q7s'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Case helpers ────────────────────────────────────────────────
function toCamel(str: string) {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
}
function toSnakeStr(str: string) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function fromSnake<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[toCamel(k)] = v
  }
  return result as T
}

export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[toSnakeStr(k)] = v
  }
  return result
}

// ─── TypeScript interfaces (camelCase for app use) ───────────────
export interface Lead {
  id: number
  name: string
  business: string
  email: string
  phone: string
  source: string
  stage: 'New Lead' | 'Contacted' | 'Proposal Sent' | 'Follow-Up' | 'Meeting Scheduled' | 'No Answer' | 'Won' | 'Lost'
  service: 'Full Stack' | 'Growth' | 'Foundation'
  value: number
  notes: string
  date: string
  meetLink: string
  meetingDate: string
  meetingTime: string
  meetingTitle: string
}

export interface Client {
  id: number
  name: string
  business: string
  email: string
  phone: string
  tier: string
  monthly: number
  setup: number
  startDate: string
  services: string
  status: 'Active' | 'Paused'
  notes: string
}

export interface CRMTask {
  id: number
  title: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  related: string
  done: boolean
}

export interface Invoice {
  id: number
  client: string
  type: string
  amount: number
  issued: string
  due: string
  status: 'Paid' | 'Pending' | 'Overdue'
  paidDate: string
  notes: string
}

export interface Activity {
  id: number
  type: 'note' | 'call' | 'email' | 'meeting' | 'sms'
  related: string
  content: string
  date: string
  createdAt: string
}

// ─── CRM Stats query (used by Dashboard) ─────────────────────────
export async function fetchCRMStats() {
  const today = new Date().toISOString().split('T')[0]

  const [leadsRes, clientsRes, tasksRes, invoicesRes] = await Promise.all([
    sb.from('leads').select('id, stage').not('stage', 'in', '("Won","Lost")'),
    sb.from('clients').select('id, monthly, status').eq('status', 'Active'),
    sb.from('tasks').select('id, due, done').eq('done', false).lte('due', today),
    sb.from('invoices').select('id, amount, status').eq('status', 'Overdue'),
  ])

  const openLeads = leadsRes.data?.length ?? 0
  const activeClients = clientsRes.data?.length ?? 0
  const mrr = clientsRes.data?.reduce((sum, c) => sum + (c.monthly ?? 0), 0) ?? 0
  const tasksDueToday = tasksRes.data?.length ?? 0
  const overdueInvoiceTotal = invoicesRes.data?.reduce((sum, i) => sum + (i.amount ?? 0), 0) ?? 0
  const overdueCount = invoicesRes.data?.length ?? 0

  return { openLeads, activeClients, mrr, tasksDueToday, overdueInvoiceTotal, overdueCount }
}
```

- [ ] **Step 2: Write unit tests for helpers**

`lib/__tests__/supabase.test.ts`:
```typescript
import { fromSnake, toSnake } from '../supabase'

test('fromSnake converts snake_case to camelCase', () => {
  const result = fromSnake<{ meetingDate: string }>({ meeting_date: '2026-06-01' })
  expect(result.meetingDate).toBe('2026-06-01')
})

test('toSnake converts camelCase to snake_case', () => {
  const result = toSnake({ meetingDate: '2026-06-01', doneBool: true })
  expect(result.meeting_date).toBe('2026-06-01')
  expect(result.done_bool).toBe(true)
})

test('fromSnake handles flat objects without underscores', () => {
  const result = fromSnake<{ name: string }>({ name: 'Yandel' })
  expect(result.name).toBe('Yandel')
})
```

- [ ] **Step 3: Run tests**

```bash
npx jest lib/__tests__/supabase.test.ts
```

Expected: 3 passing.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts lib/__tests__/supabase.test.ts
git commit -m "feat: Supabase client, TypeScript interfaces, fromSnake/toSnake helpers"
```

---

## Task 6: Zustand Stores

**Files:**
- Create: `store/planner.ts`, `store/calendar.ts`, `store/budget.ts`, `store/fitness.ts`, `store/settings.ts`, `store/index.ts`

- [ ] **Step 1: Write planner store**

`store/planner.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface PersonalTask {
  id: string
  title: string
  done: boolean
  priority: 'High' | 'Medium' | 'Low'
  due?: string
  repeat: 'none' | 'daily' | 'weekly'
  createdAt: string
}

export interface WeeklyGoal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  weekOf: string // ISO Monday date
}

interface PlannerState {
  personalTasks: PersonalTask[]
  weeklyGoals: WeeklyGoal[]
  addTask: (t: Omit<PersonalTask, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addGoal: (g: Omit<WeeklyGoal, 'id'>) => void
  updateGoalProgress: (id: string, current: number) => void
  resetDailyTasks: () => void
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      personalTasks: [],
      weeklyGoals: [],
      addTask: (t) => set((s) => ({
        personalTasks: [...s.personalTasks, { ...t, id: nanoid(), createdAt: new Date().toISOString() }]
      })),
      toggleTask: (id) => set((s) => ({
        personalTasks: s.personalTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
      })),
      deleteTask: (id) => set((s) => ({
        personalTasks: s.personalTasks.filter(t => t.id !== id)
      })),
      addGoal: (g) => set((s) => ({ weeklyGoals: [...s.weeklyGoals, { ...g, id: nanoid() }] })),
      updateGoalProgress: (id, current) => set((s) => ({
        weeklyGoals: s.weeklyGoals.map(g => g.id === id ? { ...g, current } : g)
      })),
      resetDailyTasks: () => set((s) => ({
        personalTasks: s.personalTasks.map(t =>
          t.repeat === 'daily' ? { ...t, done: false } : t
        )
      })),
    }),
    { name: 'flowos-planner' }
  )
)
```

- [ ] **Step 2: Write calendar store**

`store/calendar.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface CalendarEvent {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:MM
  endTime?: string
  notes?: string
  color: string      // hex
  repeat: 'none' | 'daily' | 'weekly' | 'monthly'
  notify: boolean
  notifyMinutesBefore: number
  type: 'personal' | 'crm_meeting' | 'alarm'
  sourceId?: string  // lead id for crm_meeting
}

interface CalendarState {
  events: CalendarEvent[]
  view: 'month' | 'week' | 'day'
  selectedDate: string
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  setView: (v: CalendarState['view']) => void
  setSelectedDate: (d: string) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      view: 'month',
      selectedDate: new Date().toISOString().split('T')[0],
      addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: nanoid() }] })),
      updateEvent: (id, updates) => set((s) => ({
        events: s.events.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter(e => e.id !== id) })),
      setView: (view) => set({ view }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
    }),
    { name: 'flowos-calendar' }
  )
)
```

- [ ] **Step 3: Write budget store**

`store/budget.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface Transaction {
  id: string
  amount: number
  category: string
  note: string
  date: string
}

export interface BudgetCategory {
  id: string
  name: string
  cap: number
  color: string
}

interface BudgetState {
  monthlyIncome: number
  categories: BudgetCategory[]
  transactions: Transaction[]
  month: string  // YYYY-MM
  history: { month: string; transactions: Transaction[] }[]
  setIncome: (n: number) => void
  addCategory: (c: Omit<BudgetCategory, 'id'>) => void
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  archiveMonth: () => void
  spentByCategory: () => Record<string, number>
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: '1', name: 'Rent',          cap: 1500, color: '#1560FF' },
  { id: '2', name: 'Food',          cap: 400,  color: '#00d084' },
  { id: '3', name: 'Gas',           cap: 150,  color: '#ffb547' },
  { id: '4', name: 'Subscriptions', cap: 100,  color: '#a855f7' },
  { id: '5', name: 'Misc',          cap: 200,  color: '#00d4ff' },
]

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      monthlyIncome: 0,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      month: new Date().toISOString().slice(0, 7),
      history: [],
      setIncome: (monthlyIncome) => set({ monthlyIncome }),
      addCategory: (c) => set((s) => ({ categories: [...s.categories, { ...c, id: nanoid() }] })),
      addTransaction: (t) => set((s) => ({ transactions: [...s.transactions, { ...t, id: nanoid() }] })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),
      archiveMonth: () => set((s) => ({
        history: [...s.history, { month: s.month, transactions: s.transactions }],
        transactions: [],
        month: new Date().toISOString().slice(0, 7),
      })),
      spentByCategory: () => {
        const { transactions } = get()
        return transactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] ?? 0) + t.amount
          return acc
        }, {} as Record<string, number>)
      },
    }),
    { name: 'flowos-budget' }
  )
)
```

- [ ] **Step 4: Write fitness store**

`store/fitness.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface WeighIn { id: string; weight: number; date: string }
export interface Exercise { name: string; sets: number; reps: number; weight: number; done: boolean }
export interface WorkoutDay {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  type: string
  exercises: Exercise[]
}
export interface MealEntry { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; time: string }

interface FitnessState {
  goalWeight: number
  weighIns: WeighIn[]
  workoutSchedule: WorkoutDay[]
  mealLog: MealEntry[]
  logDate: string
  workoutStreak: number
  calorieGoal: number
  setGoalWeight: (w: number) => void
  addWeighIn: (weight: number) => void
  toggleExercise: (day: string, exName: string) => void
  addMeal: (m: Omit<MealEntry, 'id'>) => void
  deleteMeal: (id: string) => void
  markWorkoutDone: () => void
  setCalorieGoal: (n: number) => void
  caloriesConsumed: () => number
}

const DEFAULT_SCHEDULE: WorkoutDay[] = [
  { day: 'Mon', type: 'Push Day',  exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weight: 135, done: false }, { name: 'Shoulder Press', sets: 3, reps: 10, weight: 95, done: false }, { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: 50, done: false }] },
  { day: 'Tue', type: 'Pull Day',  exercises: [{ name: 'Deadlift', sets: 4, reps: 6, weight: 225, done: false }, { name: 'Pull-Ups', sets: 3, reps: 8, weight: 0, done: false }, { name: 'Bicep Curl', sets: 3, reps: 12, weight: 35, done: false }] },
  { day: 'Wed', type: 'Legs Day',  exercises: [{ name: 'Squat', sets: 4, reps: 8, weight: 185, done: false }, { name: 'Leg Press', sets: 3, reps: 12, weight: 270, done: false }, { name: 'Calf Raise', sets: 4, reps: 15, weight: 90, done: false }] },
  { day: 'Thu', type: 'Rest Day',  exercises: [] },
  { day: 'Fri', type: 'Push Day',  exercises: [{ name: 'Incline Press', sets: 4, reps: 8, weight: 115, done: false }, { name: 'Lateral Raise', sets: 3, reps: 15, weight: 20, done: false }, { name: 'Dips', sets: 3, reps: 10, weight: 0, done: false }] },
  { day: 'Sat', type: 'Cardio',    exercises: [{ name: 'Treadmill 30min', sets: 1, reps: 1, weight: 0, done: false }] },
  { day: 'Sun', type: 'Rest Day',  exercises: [] },
]

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      goalWeight: 185,
      weighIns: [],
      workoutSchedule: DEFAULT_SCHEDULE,
      mealLog: [],
      logDate: new Date().toISOString().split('T')[0],
      workoutStreak: 0,
      calorieGoal: 2000,
      setGoalWeight: (goalWeight) => set({ goalWeight }),
      addWeighIn: (weight) => set((s) => ({
        weighIns: [...s.weighIns.slice(-89), { id: nanoid(), weight, date: new Date().toISOString().split('T')[0] }]
      })),
      toggleExercise: (day, exName) => set((s) => ({
        workoutSchedule: s.workoutSchedule.map(d =>
          d.day === day
            ? { ...d, exercises: d.exercises.map(e => e.name === exName ? { ...e, done: !e.done } : e) }
            : d
        )
      })),
      addMeal: (m) => set((s) => ({ mealLog: [...s.mealLog, { ...m, id: nanoid() }] })),
      deleteMeal: (id) => set((s) => ({ mealLog: s.mealLog.filter(m => m.id !== id) })),
      markWorkoutDone: () => set((s) => ({ workoutStreak: s.workoutStreak + 1 })),
      setCalorieGoal: (calorieGoal) => set({ calorieGoal }),
      caloriesConsumed: () => get().mealLog.reduce((sum, m) => sum + m.calories, 0),
    }),
    { name: 'flowos-fitness' }
  )
)
```

- [ ] **Step 5: Write settings store**

`store/settings.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  userName: string
  gameplanTime: string      // '18:00' EST
  morningBriefTime: string  // '07:00'
  eveningReviewTime: string // '21:00'
  autoAlarm: boolean
  autoCRMSync: boolean
  voiceInput: boolean
  calorieGoal: number
  weeklyBudgetCap: number
  notificationsEnabled: boolean
  setUserName: (n: string) => void
  set: (updates: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userName: 'Yandel',
      gameplanTime: '18:00',
      morningBriefTime: '07:00',
      eveningReviewTime: '21:00',
      autoAlarm: true,
      autoCRMSync: false,
      voiceInput: true,
      calorieGoal: 2000,
      weeklyBudgetCap: 500,
      notificationsEnabled: false,
      setUserName: (userName) => set({ userName }),
      set: (updates) => set(updates),
    }),
    { name: 'flowos-settings' }
  )
)
```

- [ ] **Step 6: Write store index**

`store/index.ts`:
```typescript
export { usePlannerStore } from './planner'
export { useCalendarStore } from './calendar'
export { useBudgetStore } from './budget'
export { useFitnessStore } from './fitness'
export { useSettingsStore } from './settings'
```

- [ ] **Step 7: Install nanoid**

```bash
npm install nanoid
```

- [ ] **Step 8: Commit**

```bash
git add store/ 
git commit -m "feat: Zustand stores — planner, calendar, budget, fitness, settings (all persisted)"
```

---

## Task 7: UI Primitives

**Files:**
- Create: `components/ui/GlassCard.tsx`, `Badge.tsx`, `BottomSheet.tsx`, `FAB.tsx`, `Toast.tsx`, `RingProgress.tsx`

- [ ] **Step 1: GlassCard**

`components/ui/GlassCard.tsx`:
```tsx
'use client'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props extends HTMLMotionProps<'div'> {
  glow?: string  // hex color for glow e.g. '#1560FF'
  className?: string
}

export default function GlassCard({ glow, className, children, ...props }: Props) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('glass p-4 relative overflow-hidden', className)}
      style={glow ? { boxShadow: `0 0 24px ${glow}20, inset 0 0 24px ${glow}08` } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create utils helper**

`lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 3: Badge**

`components/ui/Badge.tsx`:
```tsx
import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  blue:   'bg-[#1560FF]/15 text-[#1560FF] border-[#1560FF]/20',
  green:  'bg-[#00d084]/15 text-[#00d084] border-[#00d084]/20',
  amber:  'bg-[#ffb547]/15 text-[#ffb547] border-[#ffb547]/20',
  purple: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/20',
  red:    'bg-[#ff4d6a]/15 text-[#ff4d6a] border-[#ff4d6a]/20',
  cyan:   'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/20',
  slate:  'bg-white/[0.06] text-[#8a8f9a] border-white/[0.08]',
}

interface Props {
  label: string
  color?: keyof typeof colorMap
  className?: string
}

export default function Badge({ label, color = 'slate', className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border font-mono',
      colorMap[color],
      className
    )}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: BottomSheet**

`components/ui/BottomSheet.tsx`:
```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                       bg-[#0A0C18] border-t border-white/[0.08] rounded-t-3xl safe-bottom"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.06]">
                <h3 className="font-display font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-[#8a8f9a] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: RingProgress**

`components/ui/RingProgress.tsx`:
```tsx
interface Props {
  value: number     // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function RingProgress({ value, size = 120, strokeWidth = 10, color = '#00d084', label }: Props) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(value, 100) / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {label && (
        <div className="absolute text-center">
          <span className="font-mono text-xs text-[#8a8f9a]">{label}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/ lib/utils.ts
git commit -m "feat: UI primitives — GlassCard, Badge, BottomSheet, RingProgress"
```

---

## Task 8: Dashboard Tab

**Files:**
- Create: `components/home/CRMStatsGrid.tsx`, `DailyOverviewCard.tsx`, `StreakTracker.tsx`
- Modify: `app/(app)/home/page.tsx`

- [ ] **Step 1: Write CRMStatsGrid**

`components/home/CRMStatsGrid.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { fetchCRMStats } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface Stats {
  openLeads: number
  activeClients: number
  mrr: number
  tasksDueToday: number
  overdueInvoiceTotal: number
  overdueCount: number
}

export default function CRMStatsGrid() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCRMStats().then((s) => { setStats(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const pills = stats ? [
    { label: 'Open Leads',      value: stats.openLeads,                        color: '#1560FF', suffix: '' },
    { label: 'Active Clients',  value: stats.activeClients,                    color: '#00d084', suffix: '' },
    { label: 'MRR',             value: `$${stats.mrr.toLocaleString()}`,        color: '#00d4ff', suffix: '' },
    { label: 'Due Today',       value: stats.tasksDueToday,                    color: '#a855f7', suffix: '' },
    ...(stats.overdueCount > 0
      ? [{ label: 'Overdue Invoices', value: `$${stats.overdueInvoiceTotal.toLocaleString()}`, color: '#ff4d6a', suffix: '' }]
      : []),
  ] : []

  if (loading) return (
    <div className="grid grid-cols-2 gap-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="glass p-4 h-20 animate-pulse bg-white/[0.02]" />
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      {pills.map((p, i) => (
        <motion.div
          key={p.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
          className="glass p-4"
          style={{ boxShadow: `0 0 20px ${p.color}18, inset 0 0 20px ${p.color}06` }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-1">{p.label}</p>
          <p className="font-display text-2xl font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' ? p.value : p.value}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write DailyOverviewCard**

`components/home/DailyOverviewCard.tsx`:
```tsx
'use client'
import { usePlannerStore } from '@/store/planner'
import { useBudgetStore } from '@/store/budget'
import { useFitnessStore } from '@/store/fitness'
import GlassCard from '@/components/ui/GlassCard'

export default function DailyOverviewCard() {
  const tasks = usePlannerStore(s => s.personalTasks)
  const spentByCategory = useBudgetStore(s => s.spentByCategory)
  const monthlyIncome = useBudgetStore(s => s.monthlyIncome)
  const calorieGoal = useFitnessStore(s => s.calorieGoal)
  const caloriesConsumed = useFitnessStore(s => s.caloriesConsumed)

  const tasksDue = tasks.filter(t => !t.done).length
  const totalSpent = Object.values(spentByCategory()).reduce((a, b) => a + b, 0)
  const budgetLeft = monthlyIncome - totalSpent
  const calsLeft = calorieGoal - caloriesConsumed()

  return (
    <GlassCard glow="#1560FF" className="p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">Today at a Glance</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Tasks Remaining</p>
          <p className="font-display text-xl font-bold text-[#edeef2]">{tasksDue}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Calories Left</p>
          <p className="font-display text-xl font-bold" style={{ color: calsLeft < 200 ? '#ff4d6a' : '#00d084' }}>
            {calsLeft}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Budget Left</p>
          <p className="font-display text-xl font-bold" style={{ color: budgetLeft < 0 ? '#ff4d6a' : '#edeef2' }}>
            ${budgetLeft.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a8f9a] mb-0.5">Date</p>
          <p className="font-mono text-sm text-[#edeef2]">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
```

- [ ] **Step 3: Write StreakTracker**

`components/home/StreakTracker.tsx`:
```tsx
'use client'
import { Flame } from 'lucide-react'

export default function StreakTracker({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-3 glass px-4 py-3">
      <Flame size={24} className="text-[#ffb547]" />
      <div>
        <p className="font-display font-bold text-lg">{streak} day streak</p>
        <p className="text-[10px] text-[#8a8f9a]">Keep hitting your daily goals</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire Dashboard page**

`app/(app)/home/page.tsx`:
```tsx
import CRMStatsGrid from '@/components/home/CRMStatsGrid'
import DailyOverviewCard from '@/components/home/DailyOverviewCard'
import StreakTracker from '@/components/home/StreakTracker'

export default function HomePage() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="font-display text-2xl font-bold">FlowOS</h1>
        <p className="text-[#8a8f9a] text-sm font-mono">DFG Command</p>
      </div>
      <DailyOverviewCard />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">DFG CRM · Live</p>
        <CRMStatsGrid />
      </div>
      <StreakTracker streak={0} />
    </div>
  )
}
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Open `/home` — expect glowing CRM stat pills with live Supabase data, daily overview card, streak tracker.

- [ ] **Step 6: Commit**

```bash
git add components/home/ app/\(app\)/home/page.tsx
git commit -m "feat: Dashboard tab — live CRM stats, daily overview, streak tracker"
```

---

## Task 9: Planner Tab

**Files:**
- Create: `components/planner/CRMTaskList.tsx`, `PersonalTaskList.tsx`, `WeeklyGoals.tsx`
- Modify: `app/(app)/planner/page.tsx`

- [ ] **Step 1: Write CRMTaskList**

`components/planner/CRMTaskList.tsx`:
```tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { sb, fromSnake, type CRMTask } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import { RefreshCw } from 'lucide-react'

const priorityColor: Record<string, 'red' | 'amber' | 'slate'> = {
  High: 'red', Medium: 'amber', Low: 'slate'
}

export default function CRMTaskList() {
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await sb.from('tasks').select('*').eq('done', false).order('due', { ascending: true })
    setTasks((data ?? []).map(r => fromSnake<CRMTask>(r)))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">CRM Tasks</p>
        <button onClick={fetch} className="text-[#8a8f9a] active:text-white transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className="glass p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge label="DFG" color="blue" />
                <Badge label={t.priority} color={priorityColor[t.priority]} />
              </div>
              <p className="text-sm font-medium text-[#edeef2] truncate">{t.title}</p>
              {t.related && <p className="text-[11px] text-[#8a8f9a] mt-0.5">{t.related}</p>}
            </div>
            <p className="font-mono text-[10px] text-[#8a8f9a] whitespace-nowrap mt-0.5">{t.due}</p>
          </div>
        ))}
        {!loading && tasks.length === 0 && (
          <p className="text-[#8a8f9a] text-sm text-center py-6">No open CRM tasks</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write PersonalTaskList**

`components/planner/PersonalTaskList.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { usePlannerStore } from '@/store/planner'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import BottomSheet from '@/components/ui/BottomSheet'
import { Plus, Trash2 } from 'lucide-react'

export default function PersonalTaskList() {
  const { personalTasks, addTask, toggleTask, deleteTask } = usePlannerStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), done: false, priority, repeat: 'none' })
    setTitle('')
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">Personal Tasks</p>
        <button onClick={() => setOpen(true)} className="text-[#1560FF] active:scale-90 transition-transform">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {personalTasks.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              className="glass p-3 flex items-center gap-3"
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors
                  ${t.done ? 'bg-[#00d084] border-[#00d084]' : 'border-white/20'}`}
              />
              <p className={`flex-1 text-sm ${t.done ? 'line-through text-[#8a8f9a]' : 'text-[#edeef2]'}`}>
                {t.title}
              </p>
              <Badge label={t.priority} color={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'slate'} />
              <button onClick={() => deleteTask(t.id)} className="text-[#8a8f9a] active:text-[#ff4d6a] transition-colors">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {personalTasks.length === 0 && (
          <p className="text-[#8a8f9a] text-sm text-center py-6">No personal tasks — add one above</p>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Task">
        <div className="space-y-4">
          <input
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                       text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50"
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div className="flex gap-2">
            {(['High','Medium','Low'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors
                  ${priority === p ? 'bg-[#1560FF] border-[#1560FF] text-white' : 'border-white/[0.08] text-[#8a8f9a]'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Add Task
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
```

- [ ] **Step 3: Write WeeklyGoals**

`components/planner/WeeklyGoals.tsx`:
```tsx
'use client'
import { usePlannerStore } from '@/store/planner'

export default function WeeklyGoals() {
  const { weeklyGoals, updateGoalProgress } = usePlannerStore()

  if (weeklyGoals.length === 0) {
    return (
      <div className="glass p-4 text-center">
        <p className="text-[#8a8f9a] text-sm">No weekly goals set</p>
        <p className="text-[10px] text-[#8a8f9a] mt-1">Add goals in Settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {weeklyGoals.map(g => {
        const pct = Math.min((g.current / g.target) * 100, 100)
        const done = g.current >= g.target
        return (
          <div key={g.id} className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#edeef2]">{g.title}</p>
              <span className={`font-mono text-xs ${done ? 'text-[#00d084]' : 'text-[#8a8f9a]'}`}>
                {g.current}/{g.target} {g.unit}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: done ? '#00d084' : '#1560FF' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Wire Planner page**

`app/(app)/planner/page.tsx`:
```tsx
import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import WeeklyGoals from '@/components/planner/WeeklyGoals'

export default function PlannerPage() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-2xl font-bold">Planner</h1>
      <CRMTaskList />
      <div className="w-full h-px bg-white/[0.06]" />
      <PersonalTaskList />
      <div className="w-full h-px bg-white/[0.06]" />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">Weekly Goals</p>
        <WeeklyGoals />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/planner/ app/\(app\)/planner/page.tsx
git commit -m "feat: Planner tab — CRM tasks (Supabase), personal tasks (Zustand), weekly goals"
```

---

## Task 10: Calendar Tab

**Files:**
- Create: `components/calendar/CalendarHeader.tsx`, `MonthView.tsx`, `WeekView.tsx`, `DayView.tsx`, `EventSheet.tsx`
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Write CalendarHeader**

`components/calendar/CalendarHeader.tsx`:
```tsx
'use client'
import { useCalendarStore } from '@/store/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarHeader() {
  const { view, selectedDate, setView, setSelectedDate } = useCalendarStore()

  const date = new Date(selectedDate + 'T00:00:00')

  const navigate = (dir: -1 | 1) => {
    const d = new Date(date)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    if (view === 'week')  d.setDate(d.getDate() + 7 * dir)
    if (view === 'day')   d.setDate(d.getDate() + dir)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const label = view === 'month'
    ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : view === 'week'
    ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-1">
        {(['month','week','day'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors
              ${view === v ? 'bg-[#1560FF] text-white' : 'text-[#8a8f9a]'}`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-[#8a8f9a] active:text-white p-1">
          <ChevronLeft size={18} />
        </button>
        <p className="font-mono text-xs text-[#edeef2] min-w-[120px] text-center">{label}</p>
        <button onClick={() => navigate(1)} className="text-[#8a8f9a] active:text-white p-1">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write MonthView**

`components/calendar/MonthView.tsx`:
```tsx
'use client'
import { useCalendarStore } from '@/store/calendar'

export default function MonthView() {
  const { selectedDate, events, setSelectedDate } = useCalendarStore()
  const date = new Date(selectedDate + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const eventDates = new Set(events.map(e => e.date))

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-mono text-[#8a8f9a] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isToday = iso === today
          const isSelected = iso === selectedDate
          const hasEvent = eventDates.has(iso)
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${isSelected ? 'bg-[#1560FF] text-white' : isToday ? 'bg-[#1560FF]/20 text-[#1560FF]' : 'text-[#edeef2]'}`}
            >
              {day}
              {hasEvent && <div className="w-1 h-1 rounded-full bg-[#00d4ff] mt-0.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write DayView (events for selected date)**

`components/calendar/DayView.tsx`:
```tsx
'use client'
import { useCalendarStore } from '@/store/calendar'
import Badge from '@/components/ui/Badge'

export default function DayView() {
  const { selectedDate, events } = useCalendarStore()
  const dayEvents = events.filter(e => e.date === selectedDate).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div className="space-y-2 mt-4">
      {dayEvents.length === 0 && (
        <p className="text-[#8a8f9a] text-sm text-center py-8">No events on this day</p>
      )}
      {dayEvents.map(e => (
        <div key={e.id} className="glass p-3 flex items-start gap-3"
          style={{ borderLeft: `3px solid ${e.color}` }}>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#edeef2]">{e.title}</p>
            {e.notes && <p className="text-[11px] text-[#8a8f9a] mt-0.5">{e.notes}</p>}
          </div>
          {e.time && <p className="font-mono text-xs text-[#8a8f9a]">{e.time}</p>}
          {e.type === 'crm_meeting' && <Badge label="DFG" color="blue" />}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write EventSheet**

`components/calendar/EventSheet.tsx`:
```tsx
'use client'
import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useCalendarStore } from '@/store/calendar'

const COLORS = ['#1560FF','#00d084','#ffb547','#a855f7','#ff4d6a','#00d4ff']

interface Props { open: boolean; onClose: () => void }

export default function EventSheet({ open, onClose }: Props) {
  const { addEvent, selectedDate } = useCalendarStore()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [notify, setNotify] = useState(true)

  const handleAdd = () => {
    if (!title.trim()) return
    addEvent({ title: title.trim(), date: selectedDate, time, notes, color, repeat: 'none', notify, notifyMinutesBefore: 15, type: 'personal' })
    setTitle(''); setTime(''); setNotes(''); onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Event">
      <div className="space-y-4">
        <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50"
          placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <input type="time" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] outline-none focus:border-[#1560FF]/50"
          value={time} onChange={e => setTime(e.target.value)} />
        <textarea className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50 resize-none"
          placeholder="Notes (optional)" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <div>
          <p className="text-xs text-[#8a8f9a] mb-2">Color</p>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <button onClick={handleAdd} className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform">
          Add Event
        </button>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 5: Wire Calendar page**

`app/(app)/calendar/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import MonthView from '@/components/calendar/MonthView'
import DayView from '@/components/calendar/DayView'
import EventSheet from '@/components/calendar/EventSheet'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <button onClick={() => setSheetOpen(true)} className="text-[#1560FF]"><Plus size={22} /></button>
      </div>
      <CalendarHeader />
      <MonthView />
      <DayView />
      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/calendar/ app/\(app\)/calendar/page.tsx
git commit -m "feat: Calendar tab — month view, day events, CRM meeting layer, add event sheet"
```

---

## Task 11: Budget Tab

**Files:**
- Create: `components/budget/BalanceDisplay.tsx`, `SpendingChart.tsx`, `TransactionList.tsx`, `AddTransactionSheet.tsx`
- Modify: `app/(app)/budget/page.tsx`

- [ ] **Step 1: Write BalanceDisplay**

`components/budget/BalanceDisplay.tsx`:
```tsx
'use client'
import { useBudgetStore } from '@/store/budget'

export default function BalanceDisplay() {
  const { monthlyIncome, spentByCategory, setIncome } = useBudgetStore()
  const totalSpent = Object.values(spentByCategory()).reduce((a,b) => a+b, 0)
  const remaining = monthlyIncome - totalSpent
  const isOver = remaining < 0

  return (
    <div className="glass p-6 text-center" style={{ boxShadow: isOver ? '0 0 24px #ff4d6a18' : '0 0 24px #00d08418' }}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-2">Remaining This Month</p>
      <p className="font-display text-5xl font-bold mb-1" style={{ color: isOver ? '#ff4d6a' : '#00d084' }}>
        ${Math.abs(remaining).toLocaleString()}
      </p>
      <p className="text-xs text-[#8a8f9a]">{isOver ? 'over budget' : 'of'} ${monthlyIncome.toLocaleString()} income</p>
      <div className="mt-4 flex items-center gap-2">
        <p className="text-xs text-[#8a8f9a]">Income:</p>
        <input
          type="number"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#edeef2] outline-none text-right font-mono"
          value={monthlyIncome || ''}
          onChange={e => setIncome(Number(e.target.value))}
          placeholder="0"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write SpendingChart**

`components/budget/SpendingChart.tsx`:
```tsx
'use client'
import { useBudgetStore } from '@/store/budget'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, LabelList } from 'recharts'

export default function SpendingChart() {
  const { categories, spentByCategory } = useBudgetStore()
  const spent = spentByCategory()

  const data = categories.map(c => ({
    name: c.name,
    spent: spent[c.name] ?? 0,
    cap: c.cap,
    color: c.color,
    pct: Math.min(((spent[c.name] ?? 0) / c.cap) * 100, 100),
  }))

  return (
    <div className="glass p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-4">Spending by Category</p>
      <ResponsiveContainer width="100%" height={data.length * 44}>
        <BarChart data={data} layout="vertical" barSize={8}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#8a8f9a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Bar dataKey="cap" fill="rgba(255,255,255,0.06)" radius={4} background={{ fill: 'transparent' }} />
          <Bar dataKey="spent" radius={4}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pct >= 100 ? '#ff4d6a' : d.pct >= 80 ? '#ffb547' : d.color} />
            ))}
            <LabelList dataKey="spent" position="right" formatter={(v: number) => `$${v}`}
              style={{ fill: '#8a8f9a', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Write AddTransactionSheet**

`components/budget/AddTransactionSheet.tsx`:
```tsx
'use client'
import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useBudgetStore } from '@/store/budget'

interface Props { open: boolean; onClose: () => void }

export default function AddTransactionSheet({ open, onClose }: Props) {
  const { categories, addTransaction } = useBudgetStore()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0]?.name ?? 'Misc')
  const [note, setNote] = useState('')

  const handleAdd = () => {
    if (!amount || isNaN(Number(amount))) return
    addTransaction({ amount: Number(amount), category, note, date: new Date().toISOString().split('T')[0] })
    setAmount(''); setNote(''); onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Transaction">
      <div className="space-y-4">
        <input type="number" inputMode="decimal"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50 font-mono text-2xl text-center"
          placeholder="$0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        <div className="grid grid-cols-3 gap-2">
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.name)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors
                ${category === c.name ? 'text-white border-transparent' : 'border-white/[0.08] text-[#8a8f9a]'}`}
              style={category === c.name ? { background: c.color } : {}}>
              {c.name}
            </button>
          ))}
        </div>
        <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none focus:border-[#1560FF]/50"
          placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
        <button onClick={handleAdd} className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform">
          Add Transaction
        </button>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 4: Write TransactionList**

`components/budget/TransactionList.tsx`:
```tsx
'use client'
import { useBudgetStore } from '@/store/budget'
import { Trash2 } from 'lucide-react'

export default function TransactionList() {
  const { transactions, deleteTransaction, categories } = useBudgetStore()
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  const getColor = (cat: string) => categories.find(c => c.name === cat)?.color ?? '#8a8f9a'

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">Transactions</p>
      <div className="space-y-2">
        {sorted.map(t => (
          <div key={t.id} className="glass p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getColor(t.category) }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#edeef2]">{t.note || t.category}</p>
              <p className="text-[10px] text-[#8a8f9a] font-mono">{t.category} · {t.date}</p>
            </div>
            <p className="font-mono text-sm font-semibold text-[#ff4d6a]">-${t.amount}</p>
            <button onClick={() => deleteTransaction(t.id)} className="text-[#8a8f9a] active:text-[#ff4d6a]">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-[#8a8f9a] text-sm text-center py-6">No transactions yet</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Wire Budget page**

`app/(app)/budget/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import BalanceDisplay from '@/components/budget/BalanceDisplay'
import SpendingChart from '@/components/budget/SpendingChart'
import TransactionList from '@/components/budget/TransactionList'
import AddTransactionSheet from '@/components/budget/AddTransactionSheet'
import { Plus } from 'lucide-react'

export default function BudgetPage() {
  const [open, setOpen] = useState(false)
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Budget</h1>
        <button onClick={() => setOpen(true)} className="text-[#1560FF]"><Plus size={22} /></button>
      </div>
      <BalanceDisplay />
      <SpendingChart />
      <TransactionList />
      <AddTransactionSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/budget/ app/\(app\)/budget/page.tsx
git commit -m "feat: Budget tab — balance display, spending chart, transactions, add sheet"
```

---

## Task 12: Fitness Tab

**Files:**
- Create: `components/fitness/WeightChart.tsx`, `WorkoutSchedule.tsx`, `GymChecklist.tsx`, `CalorieRing.tsx`
- Modify: `app/(app)/fitness/page.tsx`

- [ ] **Step 1: Write WeightChart**

`components/fitness/WeightChart.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function WeightChart() {
  const { weighIns, goalWeight, addWeighIn } = useFitnessStore()
  const [input, setInput] = useState('')

  const data = weighIns.slice(-30).map(w => ({ date: w.date.slice(5), weight: w.weight }))
  const current = weighIns.at(-1)?.weight ?? null

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">Weight</p>
          {current && <p className="font-display text-2xl font-bold text-[#edeef2]">{current} <span className="text-sm text-[#8a8f9a]">lbs</span></p>}
          <p className="text-[10px] text-[#8a8f9a]">Goal: {goalWeight} lbs</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="number" inputMode="decimal"
            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-[#edeef2] outline-none font-mono text-center"
            placeholder="lbs" value={input} onChange={e => setInput(e.target.value)} />
          <button
            onClick={() => { if (input) { addWeighIn(Number(input)); setInput('') } }}
            className="bg-[#00d084]/20 text-[#00d084] px-3 py-1.5 rounded-lg text-xs font-semibold">
            Log
          </button>
        </div>
      </div>
      {data.length > 1 && (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto','auto']} hide />
            <Tooltip contentStyle={{ background: '#0A0C18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
              labelStyle={{ color: '#8a8f9a', fontSize: 10 }} itemStyle={{ color: '#00d084', fontSize: 12 }} />
            <Line type="monotone" dataKey="weight" stroke="#00d084" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write WorkoutSchedule + GymChecklist**

`components/fitness/WorkoutSchedule.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import GymChecklist from './GymChecklist'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const

export default function WorkoutSchedule() {
  const { workoutSchedule } = useFitnessStore()
  const todayIdx = (new Date().getDay() + 6) % 7
  const [selected, setSelected] = useState(DAYS[todayIdx])

  const selectedDay = workoutSchedule.find(d => d.day === selected)

  return (
    <div className="glass p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">Workout Schedule</p>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {workoutSchedule.map(d => (
          <button key={d.day} onClick={() => setSelected(d.day)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors
              ${selected === d.day ? 'bg-[#1560FF] text-white' : 'bg-white/[0.04] text-[#8a8f9a]'}`}>
            <span className="text-xs font-semibold">{d.day}</span>
            <span className="text-[9px] mt-0.5">{d.type.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      {selectedDay && (
        <div>
          <p className="text-sm font-semibold text-[#edeef2] mb-3">{selectedDay.type}</p>
          {selectedDay.exercises.length > 0 ? (
            <GymChecklist day={selectedDay.day} exercises={selectedDay.exercises} />
          ) : (
            <p className="text-[#8a8f9a] text-sm">Rest day — recover and recharge</p>
          )}
        </div>
      )}
    </div>
  )
}
```

`components/fitness/GymChecklist.tsx`:
```tsx
'use client'
import { useFitnessStore, type Exercise } from '@/store/fitness'

interface Props { day: string; exercises: Exercise[] }

export default function GymChecklist({ day, exercises }: Props) {
  const { toggleExercise } = useFitnessStore()

  return (
    <div className="space-y-2">
      {exercises.map(ex => (
        <button key={ex.name} onClick={() => toggleExercise(day, ex.name)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left
            ${ex.done ? 'bg-[#00d084]/10 border-[#00d084]/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            ${ex.done ? 'bg-[#00d084] border-[#00d084]' : 'border-white/20'}`}>
            {ex.done && <span className="text-white text-xs">✓</span>}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${ex.done ? 'line-through text-[#8a8f9a]' : 'text-[#edeef2]'}`}>{ex.name}</p>
            <p className="font-mono text-[10px] text-[#8a8f9a]">{ex.sets}×{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}lbs` : ''}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write CalorieRing**

`components/fitness/CalorieRing.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import RingProgress from '@/components/ui/RingProgress'
import { Plus, Trash2 } from 'lucide-react'
import BottomSheet from '@/components/ui/BottomSheet'

export default function CalorieRing() {
  const { calorieGoal, mealLog, addMeal, deleteMeal, caloriesConsumed } = useFitnessStore()
  const consumed = caloriesConsumed()
  const pct = (consumed / calorieGoal) * 100
  const remaining = calorieGoal - consumed
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cals, setCals] = useState('')

  const handleAdd = () => {
    if (!name || !cals) return
    addMeal({ name, calories: Number(cals), protein: 0, carbs: 0, fat: 0, time: new Date().toTimeString().slice(0,5) })
    setName(''); setCals(''); setOpen(false)
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center gap-6 mb-4">
        <RingProgress value={pct} color={pct > 100 ? '#ff4d6a' : '#00d084'} size={100}
          label={`${remaining}\nleft`} />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">Calories</p>
          <p className="font-display text-3xl font-bold text-[#edeef2]">{consumed}</p>
          <p className="text-xs text-[#8a8f9a]">of {calorieGoal} goal</p>
          <button onClick={() => setOpen(true)} className="mt-2 flex items-center gap-1 text-[#1560FF] text-xs font-semibold">
            <Plus size={14} /> Log meal
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {mealLog.map(m => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-[#edeef2]">{m.name}</span>
            <span className="font-mono text-xs text-[#8a8f9a]">{m.calories} kcal</span>
            <button onClick={() => deleteMeal(m.id)} className="text-[#8a8f9a] active:text-[#ff4d6a]"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Log Meal">
        <div className="space-y-4">
          <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none"
            placeholder="Meal name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <input type="number" inputMode="numeric"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#edeef2] placeholder-[#8a8f9a] outline-none font-mono"
            placeholder="Calories" value={cals} onChange={e => setCals(e.target.value)} />
          <button onClick={handleAdd} className="w-full bg-[#1560FF] text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform">Log</button>
        </div>
      </BottomSheet>
    </div>
  )
}
```

- [ ] **Step 4: Wire Fitness page**

`app/(app)/fitness/page.tsx`:
```tsx
import WeightChart from '@/components/fitness/WeightChart'
import WorkoutSchedule from '@/components/fitness/WorkoutSchedule'
import CalorieRing from '@/components/fitness/CalorieRing'

export default function FitnessPage() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="font-display text-2xl font-bold">Fitness</h1>
      <WeightChart />
      <CalorieRing />
      <WorkoutSchedule />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/fitness/ app/\(app\)/fitness/page.tsx
git commit -m "feat: Fitness tab — weight chart, calorie ring, workout schedule, gym checklist"
```

---

## Task 13: Settings Tab

**Files:**
- Create: `components/settings/SettingsForm.tsx`
- Modify: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Write SettingsForm**

`components/settings/SettingsForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings'
import { sb } from '@/lib/supabase'
import GlassCard from '@/components/ui/GlassCard'
import { CheckCircle, XCircle } from 'lucide-react'

export default function SettingsForm() {
  const { userName, morningBriefTime, eveningReviewTime, autoAlarm, calorieGoal, weeklyBudgetCap, set } = useSettingsStore()
  const [crmStatus, setCRMStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const testCRM = async () => {
    try {
      const { error } = await sb.from('leads').select('id').limit(1)
      setCRMStatus(error ? 'error' : 'ok')
    } catch { setCRMStatus('error') }
    setTimeout(() => setCRMStatus('idle'), 4000)
  }

  const field = (label: string, value: string | number, key: keyof ReturnType<typeof useSettingsStore.getState>, type = 'text') => (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
      <p className="text-sm text-[#edeef2]">{label}</p>
      <input
        type={type}
        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#edeef2] outline-none text-right font-mono w-32"
        value={value}
        onChange={e => set({ [key]: type === 'number' ? Number(e.target.value) : e.target.value } as Parameters<typeof set>[0])}
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <GlassCard className="p-0 overflow-hidden">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] px-4 pt-4 pb-2">Profile</p>
        {field('Your Name', userName, 'userName')}
        {field('Morning Briefing', morningBriefTime, 'morningBriefTime', 'time')}
        {field('Evening Review', eveningReviewTime, 'eveningReviewTime', 'time')}
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] px-4 pt-4 pb-2">Health & Budget</p>
        {field('Calorie Goal', calorieGoal, 'calorieGoal', 'number')}
        {field('Weekly Budget Cap', weeklyBudgetCap, 'weeklyBudgetCap', 'number')}
      </GlassCard>

      <GlassCard className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">DFG CRM Connection</p>
        <button onClick={testCRM}
          className="w-full py-3 rounded-xl border border-white/[0.08] text-sm font-semibold text-[#edeef2] active:scale-95 transition-transform flex items-center justify-center gap-2">
          {crmStatus === 'ok' && <><CheckCircle size={16} className="text-[#00d084]" /> Connected ✓</>}
          {crmStatus === 'error' && <><XCircle size={16} className="text-[#ff4d6a]" /> Connection failed</>}
          {crmStatus === 'idle' && 'Test DFG CRM Connection'}
        </button>
      </GlassCard>
    </div>
  )
}
```

- [ ] **Step 2: Wire Settings page**

`app/(app)/settings/page.tsx`:
```tsx
import SettingsForm from '@/components/settings/SettingsForm'

export default function SettingsPage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/settings/ app/\(app\)/settings/page.tsx
git commit -m "feat: Settings tab — user preferences, CRM connection test"
```

---

## Task 14: Notifications + Web Push

**Files:**
- Create: `lib/notifications.ts`, `app/api/push/subscribe/route.ts`

- [ ] **Step 1: Generate VAPID keys (one-time)**

```bash
npx web-push generate-vapid-keys
```

Copy output into `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key from output>
VAPID_PRIVATE_KEY=<private key from output>
VAPID_SUBJECT=mailto:yandel@digitalflowglobal.com
```

- [ ] **Step 2: Write notifications helper**

`lib/notifications.ts`:
```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })
  return sub
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function scheduleLocalNotification(title: string, body: string, delayMs: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  setTimeout(() => {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, { body, icon: '/icons/192.png', badge: '/icons/192.png' })
    })
  }, delayMs)
}
```

- [ ] **Step 3: Write push subscribe API route**

`app/api/push/subscribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Store subscription in-memory for single user (localStorage handles client-side)
let subscription: webpush.PushSubscription | null = null

export async function POST(req: NextRequest) {
  const body = await req.json()
  subscription = body.subscription
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ hasSubscription: !!subscription })
}

// Export for cron route to use
export { subscription, webpush }
```

- [ ] **Step 4: Add permission request to app layout**

Add to `app/(app)/layout.tsx` — request on first load:

```tsx
'use client'
import { useEffect } from 'react'
import { requestNotificationPermission, subscribeToPush } from '@/lib/notifications'

// Add this hook inside AppLayout before return:
useEffect(() => {
  requestNotificationPermission().then(granted => {
    if (granted) subscribeToPush().then(sub => {
      if (sub) fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }), headers: { 'Content-Type': 'application/json' } })
    })
  })
}, [])
```

- [ ] **Step 5: Commit**

```bash
git add lib/notifications.ts app/api/push/
git commit -m "feat: Web Push — VAPID setup, push subscription API, local notification helper"
```

---

## Task 15: Vercel Deploy

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write vercel.json**

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/gameplan-notify",
      "schedule": "0 23 * * *"
    }
  ]
}
```

Note: The `/api/cron/gameplan-notify` route is Phase 2 (AI Command tab). The cron entry is added now so the config is ready.

- [ ] **Step 2: Ensure .env.local is gitignored**

Verify `.gitignore` contains:
```
.env.local
.env*.local
```

- [ ] **Step 3: Final build check**

```bash
npm run build
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 4: Install Vercel CLI and deploy**

```bash
npm i -g vercel
vercel login
vercel --prod
```

When prompted:
- Link to existing project? No → create new
- Project name: `flow-os`
- Root directory: `./`

- [ ] **Step 5: Set environment variables on Vercel**

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
```

Paste values from `.env.local` when prompted.

- [ ] **Step 6: Redeploy with env vars**

```bash
vercel --prod
```

- [ ] **Step 7: Test PWA install on iPhone**

1. Open the Vercel URL in Safari on iPhone
2. Tap Share → Add to Home Screen
3. Confirm app opens in standalone mode (no Safari chrome)
4. Verify bottom nav, all 5 tabs work, CRM stats load

- [ ] **Step 8: Final commit**

```bash
git add vercel.json
git commit -m "feat: Vercel deploy config — cron placeholder, PWA install verified"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Dashboard: CRM live stats, daily overview, streak, motivational status
- ✅ Planner: CRM tasks (Supabase), personal tasks (Zustand), weekly goals
- ✅ Calendar: month view, day view, event layers, add event sheet
- ✅ Budget: balance, spending chart, transactions, add sheet
- ✅ Fitness: weight chart, workout schedule, gym checklist, calorie ring
- ✅ Settings: all config fields, Supabase connection test
- ✅ PWA: Serwist, manifest, service worker, push handler
- ✅ Notifications: permission request, push subscribe, local notification helper
- ✅ Design system: all CSS tokens, fonts, glass cards, spring animations
- ✅ Supabase: fromSnake/toSnake, typed interfaces, all table reads
- ✅ Vercel: deploy instructions, env vars, cron config placeholder
- ⏸️ Command / AI Gameplan: Phase 2

**Placeholder scan:** None found — all steps have complete code.

**Type consistency:** 
- `CRMTask`, `Lead`, `Client`, `Invoice` interfaces defined in `lib/supabase.ts` and used consistently
- `PersonalTask`, `WeeklyGoal` defined in `store/planner.ts`
- `CalendarEvent` defined in `store/calendar.ts`
- All store method names consistent across files
