import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a day scheduler. Given a list of tasks, create a realistic time-blocked schedule.
Return ONLY valid JSON in this exact shape:
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
- type must be exactly "task", "break", or "buffer"
- notes field is optional but helpful (e.g. "Focus block", "Rest up")`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })

  const { tasks, wakeTime = '08:00', currentSchedule, adjustments } = await req.json()

  const userContent = adjustments
    ? `Current schedule: ${JSON.stringify(currentSchedule)}\nUser adjustment request: "${adjustments}"\nReturn an updated schedule JSON.`
    : `Wake time: ${wakeTime}\nTasks for today:\n${(tasks as string[]).map((t, i) => `${i + 1}. ${t}`).join('\n')}\nBuild a time-blocked schedule.`

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Groq schedule error:', data)
      return NextResponse.json({ error: 'AI error generating schedule' }, { status: 500 })
    }

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('Schedule error:', err)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
