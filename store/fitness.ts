import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { sb } from '@/lib/supabase'

export interface WeighIn {
  id: string
  weight: number
  date: string
}

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number
  done: boolean
}

export interface WorkoutDay {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  type: string
  exercises: Exercise[]
}

export interface MealEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

interface FitnessState {
  goalWeight: number
  weighIns: WeighIn[]
  workoutSchedule: WorkoutDay[]
  mealLog: MealEntry[]
  mealLogDate: string
  workoutStreak: number
  lastStreakDate: string
  calorieGoal: number
  setGoalWeight: (w: number) => void
  addWeighIn: (weight: number) => void
  toggleExercise: (day: string, exName: string) => void
  addExercise: (day: string, exercise: Omit<Exercise, 'done'>) => void
  removeExercise: (day: string, exName: string) => void
  setDayType: (day: string, type: string) => void
  addMeal: (m: Omit<MealEntry, 'id'>) => void
  deleteMeal: (id: string) => void
  markWorkoutDone: () => void
  setCalorieGoal: (n: number) => void
  caloriesConsumed: () => number
  checkAndResetDay: () => void
  hydrateMeals: () => Promise<void>
}

const DEFAULT_SCHEDULE: WorkoutDay[] = [
  {
    day: 'Mon', type: 'Push Day',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 135, done: false },
      { name: 'Shoulder Press', sets: 3, reps: 10, weight: 95, done: false },
      { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: 50, done: false },
    ],
  },
  {
    day: 'Tue', type: 'Pull Day',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: 6, weight: 225, done: false },
      { name: 'Pull-Ups', sets: 3, reps: 8, weight: 0, done: false },
      { name: 'Bicep Curl', sets: 3, reps: 12, weight: 35, done: false },
    ],
  },
  {
    day: 'Wed', type: 'Legs Day',
    exercises: [
      { name: 'Squat', sets: 4, reps: 8, weight: 185, done: false },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 270, done: false },
      { name: 'Calf Raise', sets: 4, reps: 15, weight: 90, done: false },
    ],
  },
  { day: 'Thu', type: 'Rest Day', exercises: [] },
  {
    day: 'Fri', type: 'Push Day',
    exercises: [
      { name: 'Incline Press', sets: 4, reps: 8, weight: 115, done: false },
      { name: 'Lateral Raise', sets: 3, reps: 15, weight: 20, done: false },
      { name: 'Dips', sets: 3, reps: 10, weight: 0, done: false },
    ],
  },
  {
    day: 'Sat', type: 'Cardio',
    exercises: [{ name: 'Treadmill 30min', sets: 1, reps: 1, weight: 0, done: false }],
  },
  { day: 'Sun', type: 'Rest Day', exercises: [] },
]

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      goalWeight: 185,
      weighIns: [],
      workoutSchedule: DEFAULT_SCHEDULE,
      mealLog: [],
      mealLogDate: new Date().toISOString().split('T')[0],
      workoutStreak: 0,
      lastStreakDate: '',
      calorieGoal: 2000,
      setGoalWeight: (goalWeight) => set({ goalWeight }),
      addWeighIn: (weight) =>
        set((s) => ({
          weighIns: [
            ...s.weighIns.slice(-89),
            { id: nanoid(), weight, date: new Date().toISOString().split('T')[0] },
          ],
        })),
      toggleExercise: (day, exName) =>
        set((s) => ({
          workoutSchedule: s.workoutSchedule.map((d) =>
            d.day === day
              ? {
                  ...d,
                  exercises: d.exercises.map((e) =>
                    e.name === exName ? { ...e, done: !e.done } : e
                  ),
                }
              : d
          ),
        })),
      addExercise: (day, exercise) =>
        set((s) => ({
          workoutSchedule: s.workoutSchedule.map((d) =>
            d.day === day ? { ...d, exercises: [...d.exercises, { ...exercise, done: false }] } : d
          ),
        })),
      removeExercise: (day, exName) =>
        set((s) => ({
          workoutSchedule: s.workoutSchedule.map((d) =>
            d.day === day
              ? { ...d, exercises: d.exercises.filter((e) => e.name !== exName) }
              : d
          ),
        })),
      setDayType: (day, type) =>
        set((s) => ({
          workoutSchedule: s.workoutSchedule.map((d) =>
            d.day === day ? { ...d, type } : d
          ),
        })),
      addMeal: (m) => {
        const today = new Date().toISOString().split('T')[0]
        const entry = { ...m, id: nanoid() }
        set((s) => {
          const log = s.mealLogDate === today ? s.mealLog : []
          return { mealLog: [...log, entry], mealLogDate: today }
        })
        sb.from('meal_log').insert({
          id: entry.id, name: entry.name, calories: entry.calories,
          protein: entry.protein, carbs: entry.carbs, fat: entry.fat,
          time: entry.time, log_date: today,
        }).then()
      },
      deleteMeal: (id) => {
        set((s) => ({ mealLog: s.mealLog.filter((m) => m.id !== id) }))
        sb.from('meal_log').delete().eq('id', id).then()
      },
      markWorkoutDone: () =>
        set((s) => {
          const today = new Date().toISOString().split('T')[0]
          if (s.lastStreakDate === today) return s
          return { workoutStreak: s.workoutStreak + 1, lastStreakDate: today }
        }),
      setCalorieGoal: (calorieGoal) => set({ calorieGoal }),
      caloriesConsumed: () => {
        const s = get()
        const today = new Date().toISOString().split('T')[0]
        if (s.mealLogDate !== today) return 0
        return s.mealLog.reduce((sum, m) => sum + m.calories, 0)
      },
      checkAndResetDay: () =>
        set((s) => {
          const today = new Date().toISOString().split('T')[0]
          if (s.mealLogDate === today) return {}
          return { mealLog: [], mealLogDate: today }
        }),
      hydrateMeals: async () => {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await sb.from('meal_log').select('*').eq('log_date', today)
        if (data) {
          set({
            mealLog: data.map((r) => ({
              id: r.id, name: r.name, calories: r.calories,
              protein: r.protein, carbs: r.carbs, fat: r.fat, time: r.time,
            })),
            mealLogDate: today,
          })
        }
      },
    }),
    { name: 'flowos-fitness' }
  )
)
