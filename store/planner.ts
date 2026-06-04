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
      addGoal: (g) =>
        set((s) => ({
          weeklyGoals: [...s.weeklyGoals, { ...g, id: nanoid() }],
        })),
      updateGoalProgress: (id, current) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.map((g) =>
            g.id === id ? { ...g, current } : g
          ),
        })),
      resetDailyTasks: () =>
        set((s) => ({
          personalTasks: s.personalTasks.map((t) =>
            t.repeat === 'daily' ? { ...t, done: false } : t
          ),
        })),
    }),
    { name: 'flowos-planner' }
  )
)
