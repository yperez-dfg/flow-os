import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { sb } from '@/lib/supabase'

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
  weekOf: string
}

export type GoalCategory = 'Work' | 'Health' | 'Finance' | 'Personal' | 'Learning'

export interface LongTermGoal {
  id: string
  title: string
  description?: string
  category: GoalCategory
  targetDate: string
  progress: number
  createdAt: string
}

export interface RoutineStep {
  id: string
  title: string
}

export interface Routine {
  id: string
  name: string
  emoji: string
  steps: RoutineStep[]
  progressDate?: string
  completedStepIds: string[]
  createdAt: string
}

export interface ScheduleBlock {
  time: string
  title: string
  duration: number
  notes?: string
  type: 'task' | 'break' | 'buffer'
}

// ── DB mappers ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToTask(r: any): PersonalTask {
  return {
    id: r.id, title: r.title, done: r.done,
    priority: r.priority, due: r.due ?? '',
    repeat: r.repeat, createdAt: r.created_at,
  }
}
function taskToDb(t: PersonalTask) {
  return { id: t.id, title: t.title, done: t.done, priority: t.priority, due: t.due ?? '', repeat: t.repeat, created_at: t.createdAt }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToGoal(r: any): WeeklyGoal {
  return { id: r.id, title: r.title, target: r.target, current: r.current, unit: r.unit, weekOf: r.week_of }
}
function goalToDb(g: WeeklyGoal) {
  return { id: g.id, title: g.title, target: g.target, current: g.current, unit: g.unit, week_of: g.weekOf }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToLTGoal(r: any): LongTermGoal {
  return { id: r.id, title: r.title, description: r.description ?? '', category: r.category, targetDate: r.target_date, progress: r.progress, createdAt: r.created_at }
}
function ltGoalToDb(g: LongTermGoal) {
  return { id: g.id, title: g.title, description: g.description ?? '', category: g.category, target_date: g.targetDate, progress: g.progress, created_at: g.createdAt }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToRoutine(r: any): Routine {
  return {
    id: r.id, name: r.name, emoji: r.emoji,
    steps: (r.steps as RoutineStep[]) ?? [],
    progressDate: r.progress_date || undefined,
    completedStepIds: r.completed_step_ids ?? [],
    createdAt: r.created_at,
  }
}
function routineToDb(r: Routine) {
  return {
    id: r.id, name: r.name, emoji: r.emoji,
    steps: r.steps,
    progress_date: r.progressDate ?? '',
    completed_step_ids: r.completedStepIds,
    created_at: r.createdAt,
  }
}

// ── Store ─────────────────────────────────────────────────────────

interface PlannerState {
  personalTasks: PersonalTask[]
  weeklyGoals: WeeklyGoal[]
  longTermGoals: LongTermGoal[]
  routines: Routine[]
  lockedSchedule: { blocks: ScheduleBlock[]; date: string } | null
  lastResetDate: string

  hydrate: () => Promise<void>

  addTask: (t: Omit<PersonalTask, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  resetDailyTasks: () => void
  resetDailyTasksIfNeeded: () => void

  addGoal: (g: Omit<WeeklyGoal, 'id'>) => void
  editGoal: (id: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => void
  deleteGoal: (id: string) => void
  updateGoalProgress: (id: string, current: number) => void

  addLongTermGoal: (g: Omit<LongTermGoal, 'id' | 'createdAt'>) => void
  editLongTermGoal: (id: string, updates: Partial<Omit<LongTermGoal, 'id' | 'createdAt'>>) => void
  deleteLongTermGoal: (id: string) => void
  updateLongTermProgress: (id: string, progress: number) => void

  addRoutine: (r: { name: string; emoji: string; steps: string[] }) => void
  editRoutine: (id: string, updates: { name?: string; emoji?: string; steps?: RoutineStep[] }) => void
  deleteRoutine: (id: string) => void
  toggleRoutineStep: (routineId: string, stepId: string) => void
  resetRoutine: (routineId: string) => void

  setLockedSchedule: (blocks: ScheduleBlock[], date: string) => void
  clearLockedSchedule: () => void
}

export const usePlannerStore = create<PlannerState>()((set, get) => ({
  personalTasks: [],
  weeklyGoals: [],
  longTermGoals: [],
  routines: [],
  lockedSchedule: null,
  lastResetDate: '',

  // ── Hydrate from Supabase ──────────────────────────────────────
  hydrate: async () => {
    const [t, g, lg, r] = await Promise.all([
      sb.from('personal_tasks').select('*'),
      sb.from('weekly_goals').select('*'),
      sb.from('long_term_goals').select('*'),
      sb.from('routines').select('*'),
    ])
    set({
      personalTasks:  (t.data  ?? []).map(dbToTask),
      weeklyGoals:    (g.data  ?? []).map(dbToGoal),
      longTermGoals:  (lg.data ?? []).map(dbToLTGoal),
      routines:       (r.data  ?? []).map(dbToRoutine),
    })
  },

  // ── Tasks ──────────────────────────────────────────────────────
  addTask: (t) => {
    const task: PersonalTask = { ...t, id: nanoid(), createdAt: new Date().toISOString() }
    set((s) => ({ personalTasks: [...s.personalTasks, task] }))
    sb.from('personal_tasks').insert(taskToDb(task)).then()
  },
  toggleTask: (id) => {
    const tasks = get().personalTasks.map((t) => t.id === id ? { ...t, done: !t.done } : t)
    set({ personalTasks: tasks })
    const task = tasks.find((t) => t.id === id)
    if (task) sb.from('personal_tasks').update({ done: task.done }).eq('id', id).then()
  },
  deleteTask: (id) => {
    set((s) => ({ personalTasks: s.personalTasks.filter((t) => t.id !== id) }))
    sb.from('personal_tasks').delete().eq('id', id).then()
  },
  resetDailyTasks: () => {
    const tasks = get().personalTasks.map((t) => t.repeat === 'daily' ? { ...t, done: false } : t)
    set({ personalTasks: tasks })
    tasks.filter((t) => t.repeat === 'daily').forEach((t) =>
      sb.from('personal_tasks').update({ done: false }).eq('id', t.id).then()
    )
  },
  resetDailyTasksIfNeeded: () => {
    const today = new Date().toISOString().split('T')[0]
    if (get().lastResetDate === today) return
    get().resetDailyTasks()
    set({ lastResetDate: today })
  },

  // ── Weekly goals ───────────────────────────────────────────────
  addGoal: (g) => {
    const goal: WeeklyGoal = { ...g, id: nanoid() }
    set((s) => ({ weeklyGoals: [...s.weeklyGoals, goal] }))
    sb.from('weekly_goals').insert(goalToDb(goal)).then()
  },
  editGoal: (id, updates) => {
    set((s) => ({ weeklyGoals: s.weeklyGoals.map((g) => g.id === id ? { ...g, ...updates } : g) }))
    const goal = get().weeklyGoals.find((g) => g.id === id)
    if (goal) sb.from('weekly_goals').update(goalToDb(goal)).eq('id', id).then()
  },
  deleteGoal: (id) => {
    set((s) => ({ weeklyGoals: s.weeklyGoals.filter((g) => g.id !== id) }))
    sb.from('weekly_goals').delete().eq('id', id).then()
  },
  updateGoalProgress: (id, current) => {
    set((s) => ({ weeklyGoals: s.weeklyGoals.map((g) => g.id === id ? { ...g, current } : g) }))
    sb.from('weekly_goals').update({ current }).eq('id', id).then()
  },

  // ── Long-term goals ────────────────────────────────────────────
  addLongTermGoal: (g) => {
    const goal: LongTermGoal = { ...g, id: nanoid(), createdAt: new Date().toISOString() }
    set((s) => ({ longTermGoals: [...s.longTermGoals, goal] }))
    sb.from('long_term_goals').insert(ltGoalToDb(goal)).then()
  },
  editLongTermGoal: (id, updates) => {
    set((s) => ({ longTermGoals: s.longTermGoals.map((g) => g.id === id ? { ...g, ...updates } : g) }))
    const goal = get().longTermGoals.find((g) => g.id === id)
    if (goal) sb.from('long_term_goals').update(ltGoalToDb(goal)).eq('id', id).then()
  },
  deleteLongTermGoal: (id) => {
    set((s) => ({ longTermGoals: s.longTermGoals.filter((g) => g.id !== id) }))
    sb.from('long_term_goals').delete().eq('id', id).then()
  },
  updateLongTermProgress: (id, progress) => {
    const clamped = Math.min(100, Math.max(0, progress))
    set((s) => ({ longTermGoals: s.longTermGoals.map((g) => g.id === id ? { ...g, progress: clamped } : g) }))
    sb.from('long_term_goals').update({ progress: clamped }).eq('id', id).then()
  },

  // ── Routines ───────────────────────────────────────────────────
  addRoutine: ({ name, emoji, steps }) => {
    const routine: Routine = {
      id: nanoid(), name: name.trim(), emoji,
      steps: steps.map((t) => t.trim()).filter(Boolean).map((title) => ({ id: nanoid(), title })),
      completedStepIds: [], createdAt: new Date().toISOString(),
    }
    set((s) => ({ routines: [...s.routines, routine] }))
    sb.from('routines').insert(routineToDb(routine)).then()
  },
  editRoutine: (id, updates) => {
    set((s) => ({ routines: s.routines.map((r) => r.id === id ? { ...r, ...updates } : r) }))
    const routine = get().routines.find((r) => r.id === id)
    if (routine) sb.from('routines').update(routineToDb(routine)).eq('id', id).then()
  },
  deleteRoutine: (id) => {
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
    sb.from('routines').delete().eq('id', id).then()
  },
  toggleRoutineStep: (routineId, stepId) => {
    const today = new Date().toISOString().split('T')[0]
    const routines = get().routines.map((r) => {
      if (r.id !== routineId) return r
      const completed = r.progressDate === today ? r.completedStepIds : []
      const next = completed.includes(stepId) ? completed.filter((x) => x !== stepId) : [...completed, stepId]
      return { ...r, progressDate: today, completedStepIds: next }
    })
    set({ routines })
    const routine = routines.find((r) => r.id === routineId)
    if (routine) sb.from('routines').update({ progress_date: routine.progressDate ?? '', completed_step_ids: routine.completedStepIds }).eq('id', routineId).then()
  },
  resetRoutine: (routineId) => {
    const routines = get().routines.map((r) =>
      r.id === routineId ? { ...r, completedStepIds: [], progressDate: undefined } : r
    )
    set({ routines })
    sb.from('routines').update({ progress_date: '', completed_step_ids: [] }).eq('id', routineId).then()
  },

  // ── Locked schedule (session-only, no DB needed) ───────────────
  setLockedSchedule: (blocks, date) => set({ lockedSchedule: { blocks, date } }),
  clearLockedSchedule: () => set({ lockedSchedule: null }),
}))
