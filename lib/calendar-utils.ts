import type { CalendarEvent } from '@/store/calendar'

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function expandEvents(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string
): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const MAX_PER_EVENT = 365

  for (const event of events) {
    if (event.repeat === 'none') {
      if (compareDates(event.date, rangeStart) >= 0 && compareDates(event.date, rangeEnd) <= 0) {
        result.push(event)
      }
      continue
    }

    let count = 0
    const originDate = new Date(event.date + 'T00:00:00')

    if (event.repeat === 'daily') {
      const startDate = compareDates(event.date, rangeStart) >= 0 ? event.date : rangeStart
      let cur = startDate
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        if (compareDates(cur, event.date) < 0) {
          cur = addDays(cur, 1)
          continue
        }
        if (cur === event.date) {
          result.push(event)
        } else {
          result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
        }
        count++
        cur = addDays(cur, 1)
      }
    } else if (event.repeat === 'weekly') {
      const originDow = originDate.getDay()
      let cur = rangeStart
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        const curDow = new Date(cur + 'T00:00:00').getDay()
        if (curDow === originDow && compareDates(cur, event.date) >= 0) {
          if (cur === event.date) {
            result.push(event)
          } else {
            result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
          }
          count++
        }
        cur = addDays(cur, 1)
      }
    } else if (event.repeat === 'monthly') {
      const originDay = originDate.getDate()
      let cur = rangeStart
      while (compareDates(cur, rangeEnd) <= 0 && count < MAX_PER_EVENT) {
        const curDate = new Date(cur + 'T00:00:00')
        const daysInMonth = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate()
        if (curDate.getDate() === Math.min(originDay, daysInMonth) && compareDates(cur, event.date) >= 0) {
          if (cur === event.date) {
            result.push(event)
          } else {
            result.push({ ...event, id: `${event.id}-${cur}`, date: cur })
          }
          count++
        }
        cur = addDays(cur, 1)
      }
    }
  }

  return result
}
