import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fromSnake } from '@/lib/supabase'
import type { Lead } from '@/lib/supabase'

const sb = createClient(
  'https://cmntmktwcrkqryuaocui.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbnRta3R3Y3JrcXJ5dWFvY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTA4MjYsImV4cCI6MjA5NDY2NjgyNn0.-t8Y43M4QChlzfMKfbmxNjTwwdsK-1NmFaHtoOr7q7s'
)

function formatDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = (timeStr || '09:00').split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export async function GET() {
  const { data: leads } = await sb
    .from('leads')
    .select('id, name, business, meeting_date, meeting_time, meeting_title')
    .not('meeting_date', 'is', null)
    .not('meeting_date', 'eq', '')

  const events: string[] = []

  for (const row of leads ?? []) {
    const lead = fromSnake<Lead>(row)
    if (!lead.meetingDate) continue

    const start = formatDate(lead.meetingDate, lead.meetingTime ?? '09:00')
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    events.push([
      'BEGIN:VEVENT',
      `UID:dfg-${lead.id}@daily-planner`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(lead.meetingTitle || `Meeting: ${lead.name}`)}`,
      `DESCRIPTION:${escapeICS(`${lead.business ?? ''} — DFG CRM`)}`,
      'END:VEVENT',
    ].join('\r\n'))
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Planner//DFG//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Daily Planner — DFG',
    'X-WR-CALDESC:CRM meetings from Daily Planner',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="daily-planner.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
