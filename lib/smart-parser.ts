import { PARSER_RULES, type ParsedAction } from './parser-rules'

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
