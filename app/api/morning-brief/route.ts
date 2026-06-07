import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ bullets: [], focus: '' })

  const body = await req.json()
  const { date, dayOfWeek, workout, personalTasks, crmTasksDueToday, calendarEvents, budget, calories } = body

  const system = `You are FlowOS, a sharp personal assistant. Generate a focused morning brief from today's context.
Be specific — name actual tasks and numbers, not generic advice.
Return ONLY valid JSON: { "bullets": ["...", "...", "..."], "focus": "..." }
Rules:
- bullets: 3-4 items, each under 12 words, start with an action verb or number
- focus: one sentence, the single most important thing today
- If no tasks/events, give a motivational but grounded observation
- TODAY is ${date}, ${dayOfWeek}`

  const userContent = JSON.stringify({
    workout,
    personalTasks,
    crmTasksDueToday,
    calendarEvents,
    budget,
    calories,
  })

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
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ bullets: [], focus: '' })

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) return NextResponse.json({ bullets: [], focus: '' })

    const parsed = JSON.parse(text)
    return NextResponse.json({
      bullets: parsed.bullets ?? [],
      focus: parsed.focus ?? '',
    })
  } catch {
    return NextResponse.json({ bullets: [], focus: '' })
  }
}
