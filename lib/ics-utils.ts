export interface ICSBlock {
  time: string      // "HH:MM"
  title: string
  duration: number  // minutes
  notes?: string
  type: 'task' | 'break' | 'buffer'
  date?: string     // "YYYY-MM-DD" (used for multi-day export)
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')
}

export function generateICS(blocks: ICSBlock[], date: string): string {
  const events = blocks
    .filter((b) => b.type !== 'buffer')
    .map((b, i) => {
      const start = new Date(`${date}T${b.time}:00`)
      const end = new Date(start.getTime() + b.duration * 60000)
      return [
        'BEGIN:VEVENT',
        `UID:flowos-${date}-${i}@flowos`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${b.title}`,
        b.notes ? `DESCRIPTION:${b.notes}` : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${b.title} starts in 10 min`,
        'END:VALARM',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlowOS//Daily Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Build a single ICS file from multiple events spanning different dates.
 * Events must have a `date` property.
 */
export function generateMultiDayICS(blocks: (ICSBlock & { date: string })[]): string {
  const veventSections: string[] = []

  blocks
    .filter((b) => b.type !== 'buffer' && b.date)
    .forEach((b, i) => {
      const start = new Date(`${b.date}T${b.time}:00`)
      const end = new Date(start.getTime() + b.duration * 60000)
      const lines = [
        'BEGIN:VEVENT',
        `UID:flowos-${b.date}-${i}@flowos`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${b.title}`,
        b.notes ? `DESCRIPTION:${b.notes}` : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${b.title} starts in 10 min`,
        'END:VALARM',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
      veventSections.push(lines)
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlowOS//All Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...veventSections,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
