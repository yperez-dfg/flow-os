import { PARSER_RULES, type ParsedAction, type RecurringExpenseItem } from './parser-rules'

// ─── Recurring expense category guesser ──────────────────────────
function guessCategory(name: string): string {
  const n = name.toLowerCase()
  if (/rent|mortgage|lease|hoa/i.test(n))                        return 'Rent'
  if (/netflix|hulu|spotify|apple|amazon|icloud|youtube|disney|paramount|peacock|max|prime|subscription/i.test(n)) return 'Subscriptions'
  if (/grocery|food|doordash|uber eats|grubhub/i.test(n))        return 'Food'
  if (/gas|shell|chevron|arco|fuel|insurance|car|auto/i.test(n)) return 'Gas'
  return 'Subscriptions' // most recurring expenses are subscriptions
}

// ─── Extract due day from a single item string ────────────────────
// Supports: "due 1st", "due 15", "1st", "15th", "on the 15" → number
// Returns 1 if not found (first of month default)
function extractDueDay(text: string): number {
  const match = text.match(/(?:due\s+(?:on\s+(?:the\s+)?)?|on\s+the\s+)(\d{1,2})(?:st|nd|rd|th)?/i)
    ?? text.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/i)
  if (!match) return 1
  const day = parseInt(match[1])
  return day >= 1 && day <= 28 ? day : 1
}

// ─── Parse a single "Name $amount [due day]" item ────────────────
function parseOneRecurringItem(raw: string): RecurringExpenseItem | null {
  const text = raw.trim()
  if (!text) return null

  // Extract amount — must have a number somewhere
  const amountMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)/)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[1])
  if (!amount) return null

  const dueDay = extractDueDay(text)

  // Name = everything before the dollar sign / amount, minus "due X" suffix
  const name = text
    .replace(/\$?\d+(?:\.\d{1,2})?/g, '')         // remove amount
    .replace(/(?:due\s+(?:on\s+(?:the\s+)?)?|on\s+the\s+)\d{1,2}(?:st|nd|rd|th)?/gi, '') // remove due date
    .replace(/\b\d{1,2}(?:st|nd|rd|th)\b/gi, '')  // remove standalone ordinals
    .replace(/[,:.]/g, '')
    .trim()
    .replace(/^./, c => c.toUpperCase())

  if (!name) return null

  return { name, amount, dueDay, category: guessCategory(name) }
}

// ─── Parse bulk recurring expenses from a full message ────────────
// Strip the trigger phrase, then split the rest by commas/newlines
export function parseRecurringExpenses(text: string): RecurringExpenseItem[] {
  const stripped = text
    .replace(/^(?:add\s+)?re[oc]+urr?(?:ing)?\s*(?:expense[s]?|bill[s]?|purchase[s]?)?\s*[:,-]?\s*/i, '')
    .trim()

  // Split by comma or newline
  const parts = stripped.split(/,|\n/).map(s => s.trim()).filter(Boolean)

  return parts.flatMap(part => {
    const item = parseOneRecurringItem(part)
    return item ? [item] : []
  })
}

function extractTime(text: string): string | undefined {
  const match = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!match) return undefined
  let hours = parseInt(match[1])
  const minutes = match[2] ? parseInt(match[2]) : 0
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function extractDate(text: string): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (/tomorrow/i.test(text)) return tomorrow.toISOString().split('T')[0]

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (const [i, day] of dayNames.entries()) {
    if (new RegExp(day, 'i').test(text)) {
      const d = new Date(today)
      const diff = (i - today.getDay() + 7) % 7 || 7
      d.setDate(today.getDate() + diff)
      return d.toISOString().split('T')[0]
    }
  }

  return today.toISOString().split('T')[0]
}

function extractAmount(text: string): number {
  const match = text.match(/\$?(\d+(?:\.\d{2})?)/)
  return match ? parseFloat(match[1]) : 0
}

function extractTitle(text: string): string {
  return text
    .replace(/remind me to?|don.?t forget to?|goal:|reminder:|ate |had |spent |paid |bought /gi, '')
    .replace(/\bat \d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
    .replace(/\btomorrow\b|\btoday\b|\btonight\b/gi, '')
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

export function parseMessage(text: string): ParsedAction {
  const trimmed = text.trim()
  if (!trimmed) return { type: 'unknown' }

  for (const rule of PARSER_RULES) {
    if (rule.pattern.test(trimmed)) {
      const title = extractTitle(trimmed)
      const date = extractDate(trimmed)
      const time = extractTime(trimmed)

      switch (rule.action) {
        case 'task':
          return {
            type: 'task',
            data: {
              title,
              done: false,
              priority: rule.priority ?? 'Medium',
              repeat: 'none',
              due: date,
            },
          }
        case 'reminder':
          return {
            type: 'reminder',
            data: {
              title,
              date,
              time,
              color: '#1560FF',
              repeat: 'none',
              notify: true,
              notifyMinutesBefore: 15,
              type: 'alarm',
            },
          }
        case 'goal':
          return {
            type: 'goal',
            data: { title, target: 1, unit: 'times' },
          }
        case 'meal':
          return {
            type: 'meal',
            data: {
              name: title,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              time: time ?? new Date().toTimeString().slice(0, 5),
            },
          }
        case 'expense':
          return {
            type: 'expense',
            data: {
              amount: extractAmount(trimmed),
              category: 'Misc',
              note: title,
              date,
            },
          }
        case 'recurring_expense': {
          const items = parseRecurringExpenses(trimmed)
          if (items.length === 0) return { type: 'unknown' }
          return { type: 'recurring_expense', items }
        }
      }
    }
  }

  // Default: treat as a task
  return {
    type: 'task',
    data: {
      title: extractTitle(trimmed),
      done: false,
      priority: 'Medium',
      repeat: 'none',
    },
  }
}
