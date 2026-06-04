import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  userName: string
  gameplanTime: string       // 'HH:MM' in EST
  morningBriefTime: string   // 'HH:MM'
  eveningReviewTime: string  // 'HH:MM'
  autoAlarm: boolean
  autoCRMSync: boolean
  voiceInput: boolean
  calorieGoal: number
  weeklyBudgetCap: number
  notificationsEnabled: boolean
  setUserName: (n: string) => void
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
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
      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
    }),
    { name: 'flowos-settings' }
  )
)
