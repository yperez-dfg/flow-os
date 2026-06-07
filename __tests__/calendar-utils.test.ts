import { expandEvents } from '@/lib/calendar-utils'
import type { CalendarEvent } from '@/store/calendar'

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'base-1',
    title: 'Test Event',
    date: '2026-06-07',
    color: '#1560FF',
    repeat: 'none',
    notify: false,
    notifyMinutesBefore: 0,
    type: 'personal',
    ...overrides,
  }
}

describe('expandEvents', () => {
  it('returns non-repeating events unchanged within range', () => {
    const ev = makeEvent({ date: '2026-06-07' })
    const result = expandEvents([ev], '2026-06-01', '2026-06-30')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('base-1')
  })

  it('excludes non-repeating events outside range', () => {
    const ev = makeEvent({ date: '2026-05-01' })
    const result = expandEvents([ev], '2026-06-01', '2026-06-30')
    expect(result).toHaveLength(0)
  })

  it('expands daily events within range', () => {
    const ev = makeEvent({ date: '2026-06-05', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-05', '2026-06-08')
    expect(result).toHaveLength(4)
    expect(result.map(e => e.date)).toEqual([
      '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08',
    ])
  })

  it('original event keeps its real id; virtual instances get suffixed ids', () => {
    const ev = makeEvent({ date: '2026-06-05', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-05', '2026-06-07')
    expect(result[0].id).toBe('base-1')
    expect(result[1].id).toBe('base-1-2026-06-06')
    expect(result[2].id).toBe('base-1-2026-06-07')
  })

  it('expands weekly events on the matching weekday', () => {
    const ev = makeEvent({ date: '2026-06-01', repeat: 'weekly' }) // Monday
    const result = expandEvents([ev], '2026-06-01', '2026-06-22')
    expect(result.map(e => e.date)).toEqual([
      '2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22',
    ])
  })

  it('expands monthly events on the matching day-of-month', () => {
    const ev = makeEvent({ date: '2026-01-15', repeat: 'monthly' })
    const result = expandEvents([ev], '2026-01-01', '2026-03-31')
    expect(result.map(e => e.date)).toEqual([
      '2026-01-15', '2026-02-15', '2026-03-15',
    ])
  })

  it('caps at 365 instances per event', () => {
    const ev = makeEvent({ date: '2024-01-01', repeat: 'daily' })
    const result = expandEvents([ev], '2024-01-01', '2026-12-31')
    expect(result).toHaveLength(365)
  })

  it('does not duplicate original date as virtual instance', () => {
    const ev = makeEvent({ date: '2026-06-07', repeat: 'daily' })
    const result = expandEvents([ev], '2026-06-07', '2026-06-09')
    const ids = result.map(e => e.id)
    expect(ids.filter(id => id === 'base-1')).toHaveLength(1)
  })
})
