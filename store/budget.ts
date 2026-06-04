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

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  category: string
  dueDay: number     // 1–28 (day of month)
  color: string
  active: boolean
}

interface BudgetState {
  monthlyIncome: number
  categories: BudgetCategory[]
  transactions: Transaction[]
  month: string  // YYYY-MM
  history: { month: string; transactions: Transaction[] }[]
  recurringExpenses: RecurringExpense[]
  setIncome: (n: number) => void
  addCategory: (c: Omit<BudgetCategory, 'id'>) => void
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  archiveMonth: () => void
  spentByCategory: () => Record<string, number>
  addRecurringExpense: (e: Omit<RecurringExpense, 'id'>) => void
  removeRecurringExpense: (id: string) => void
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
      recurringExpenses: [],
      setIncome: (monthlyIncome) => set({ monthlyIncome }),
      addCategory: (c) =>
        set((s) => ({
          categories: [...s.categories, { ...c, id: nanoid() }],
        })),
      addTransaction: (t) =>
        set((s) => ({
          transactions: [...s.transactions, { ...t, id: nanoid() }],
        })),
      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),
      archiveMonth: () =>
        set((s) => ({
          history: [
            ...s.history,
            { month: s.month, transactions: s.transactions },
          ],
          transactions: [],
          month: new Date().toISOString().slice(0, 7),
        })),
      addRecurringExpense: (e) =>
        set((s) => ({
          recurringExpenses: [...s.recurringExpenses, { ...e, id: nanoid() }],
        })),
      removeRecurringExpense: (id) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.filter(r => r.id !== id),
        })),
      spentByCategory: () => {
        const { transactions } = get()
        return transactions.reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] ?? 0) + t.amount
            return acc
          },
          {} as Record<string, number>
        )
      },
    }),
    { name: 'flowos-budget' }
  )
)
