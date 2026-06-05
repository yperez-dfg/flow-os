import { NextRequest, NextResponse } from 'next/server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM = `You are a day scheduler. Given a list of tasks, create a realistic time-blocked schedule.
Return ONLY valid JSON — no markdown, no code fences, no explanation — in this exact shape:
{
  "schedule": [
    { "time": "HH:MM", "title": "...", "duration": <minutes as number>, "notes": "...", "type": "task|break|buffer" }
  ],
  "message": "A brief friendly one-liner about the schedule"
}
Rules:
- 24-hour HH:MM times
- Start from the wake time given
- High priority tasks go earlier
- Add a 10-min buffer between tasks
- Add breaks every ~90 min of work
- Add a 30-min lunch if schedule spans midday
- type must be exactly "task", "break", or "buffer"`

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

  const { tasks, wakeTime = '08:00', currentSchedule, adjustments } = await req.json()

  const userContent = adjustments
    ? `Current schedule: ${JSON.stringify(currentSchedule)}\nUser adjustment request: "${adjustments}"\nReturn an updated schedule JSON.`
    : `Wake time: ${wakeTime}\nTasks for today:\n${(tasks as string[]).map((t, i) => `${i + 1}. ${t}`).join('\n')}\nBuild a time-blocked schedule.`

  const body = {
    contents: [{ parts: [{ text: `${SYSTEM}\n\n${userContent}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text.trim()) {
      console.error('schedule: empty Gemini response', JSON.stringify(data))
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }
    const clean = text.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Schedule error:', err)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
