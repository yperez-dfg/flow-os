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

export type GoalCategory = 'Work' | 'Health' | 'Finance' | 'Personal' | 'Learning'

export interface LongTermGoal {
  id: string
  title: string
  description?: string
  category: GoalCategory
  targetDate: string  // YYYY-MM-DD
  progress: number    // 0–100
  createdAt: string
}

interface PlannerState {
  personalTasks: PersonalTask[]
  weeklyGoals: WeeklyGoal[]
  longTermGoals: LongTermGoal[]

  // Tasks
  addTask: (t: Omit<PersonalTask, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  resetDailyTasks: () => void

  // Weekly goals
  addGoal: (g: Omit<WeeklyGoal, 'id'>) => void
  editGoal: (id: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => void
  deleteGoal: (id: string) => void
  updateGoalProgress: (id: string, current: number) => void

  // Long-term goals
  addLongTermGoal: (g: Omit<LongTermGoal, 'id' | 'createdAt'>) => void
  editLongTermGoal: (id: string, updates: Partial<Omit<LongTermGoal, 'id' | 'createdAt'>>) => void
  deleteLongTermGoal: (id: string) => void
  updateLongTermProgress: (id: string, progress: number) => void
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      personalTasks: [],
      weeklyGoals: [],
      longTermGoals: [],

      // ── Tasks ──────────────────────────────────────────────
      addTask: (t) =>
        set((s) => ({
          personalTasks: [
            ...s.personalTasks,
            { ...t, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      toggleTask: (id) =>
        set((s) => ({
          personalTasks: s.personalTasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),
      deleteTask: (id) =>
        set((s) => ({
          personalTasks: s.personalTasks.filter((t) => t.id !== id),
        })),
      resetDailyTasks: () =>
        set((s) => ({
          personalTasks: s.personalTasks.map((t) =>
            t.repeat === 'daily' ? { ...t, done: false } : t
          ),
        })),

      // ── Weekly goals ───────────────────────────────────────
      addGoal: (g) =>
        set((s) => ({
          weeklyGoals: [...s.weeklyGoals, { ...g, id: nanoid() }],
        })),
      editGoal: (id, updates) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),
      deleteGoal: (id) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.filter((g) => g.id !== id),
        })),
      updateGoalProgress: (id, current) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.map((g) =>
            g.id === id ? { ...g, current } : g
          ),
        })),

      // ── Long-term goals ────────────────────────────────────
      addLongTermGoal: (g) =>
        set((s) => ({
          longTermGoals: [
            ...s.longTermGoals,
            { ...g, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      editLongTermGoal: (id, updates) =>
        set((s) => ({
          longTermGoals: s.longTermGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),
      deleteLongTermGoal: (id) =>
        set((s) => ({
          longTermGoals: s.longTermGoals.filter((g) => g.id !== id),
        })),
      updateLongTermProgress: (id, progress) =>
        set((s) => ({
          longTermGoals: s.longTermGoals.map((g) =>
            g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g
          ),
        })),
    }),
    { name: 'flowos-planner' }
  )
)
