import type { PersonalTask } from '@/store/planner'
import type { CalendarEvent } from '@/store/calendar'
import type { Transaction } from '@/store/budget'
import type { MealEntry } from '@/store/fitness'

export interface RecurringExpenseItem {
  name: string
  amount: number
  dueDay: number    // 1–28, defaults to 1
  category: string
}

export type ParsedAction =
  | { type: 'task';               data: Omit<PersonalTask, 'id' | 'createdAt'> }
  | { type: 'reminder';           data: Omit<CalendarEvent, 'id'> }
  | { type: 'goal';               data: { title: string; target: number; unit: string } }
  | { type: 'meal';               data: Omit<MealEntry, 'id'> }
  | { type: 'expense';            data: Omit<Transaction, 'id'> }
  | { type: 'recurring_expense';  items: RecurringExpenseItem[] }
  | { type: 'unknown' }

export interface ParserRule {
  pattern: RegExp
  action: ParsedAction['type']
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
}

// ─── Add your own rules here ─────────────────────────────────────
export const PARSER_RULES: ParserRule[] = [
  // Recurring expenses — must be checked FIRST (before generic expense rule)
  { pattern: /re[oc]+urr?ing|add\s+re[oc]+urr?/i, action: 'recurring_expense' },

  // Tasks — CRM / business
  { pattern: /call|follow.?up|reach out|contact|phone/i,     action: 'task', priority: 'High' },
  { pattern: /send|email|proposal|quote/i,                   action: 'task', priority: 'Medium' },
  { pattern: /meeting|meet with|schedule|appointment/i,      action: 'task', priority: 'High' },
  { pattern: /close|deal|sign|contract/i,                    action: 'task', priority: 'High' },
  { pattern: /review|check|look at|go over/i,                action: 'task', priority: 'Medium' },

  // Tasks — fitness
  { pattern: /gym|workout|lift|train|run|cardio|exercise/i,  action: 'task', priority: 'Medium', category: 'fitness' },

  // Tasks — general
  { pattern: /buy|pick up|get|grab/i,                        action: 'task', priority: 'Low' },
  { pattern: /clean|organize|fix|repair/i,                   action: 'task', priority: 'Low' },

  // Reminders (check before generic task patterns)
  { pattern: /remind me|reminder|don.?t forget|alert me/i,   action: 'reminder' },

  // Goals
  { pattern: /goal:|weekly goal|target:|aim for/i,           action: 'goal' },

  // Meals
  { pattern: /ate|had|eating|meal|food|lunch|dinner|breakfast|snack|calories/i, action: 'meal' },

  // Expenses
  { pattern: /spent|paid|bought|expense|cost|charge/i,       action: 'expense' },
]
