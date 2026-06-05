import { NextRequest, NextResponse } from 'next/server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const today = new Date().toISOString().split('T')[0]

const SYSTEM = `You are FlowOS, a smart personal assistant embedded in a productivity app.
The user types natural-language commands. Parse the intent and return ONLY valid JSON — no markdown, no code fences, no explanation.

Use EXACTLY one of these shapes:

Task:
{ "type": "task", "data": { "title": "...", "priority": "High|Medium|Low", "done": false, "repeat": "none" } }

Reminder / Calendar event:
{ "type": "reminder", "data": { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "color": "#1560FF", "repeat": "none|daily|weekly|monthly", "notify": true, "notifyMinutesBefore": 15, "type": "personal" } }

One-time expense / transaction:
{ "type": "expense", "data": { "amount": <number>, "category": "Rent|Food|Gas|Subscriptions|Misc", "note": "...", "date": "YYYY-MM-DD", "type": "expense" } }

Recurring monthly bill (rent, subscriptions, etc):
{ "type": "recurring_expense", "items": [ { "name": "...", "amount": <number>, "category": "Rent|Food|Gas|Subscriptions|Misc", "dueDay": <1-28> } ] }

Weekly goal:
{ "type": "goal", "data": { "title": "...", "target": <number>, "unit": "...", "current": 0, "weekOf": "${today}" } }

Meal / food log:
{ "type": "meal", "data": { "name": "...", "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "time": "HH:MM" } }

Unknown / unclear:
{ "type": "unknown", "message": "Short friendly tip on what to try" }

Rules:
- TODAY is ${today}. Use 24-hour HH:MM times.
- "Rent $1500 due on the 2nd" → recurring_expense, dueDay: 2, category: "Rent"
- "Add rent $1500 every month on the 2nd" → same
- "I spent $40 on food" → expense (one-time)
- "remind me to..." → reminder
- "add a task to..." → task
- "I ate a burger 600 calories" → meal
- Multiple recurring bills in one message → multiple items in the items array
- Infer category from context: rent/mortgage → "Rent", netflix/spotify/gym → "Subscriptions", uber/gas → "Gas"
- If truly unclear, return unknown`

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ type: 'unknown', message: 'AI not configured' })

  const { message } = await req.json()

  const body = {
    contents: [{ parts: [{ text: `${SYSTEM}\n\nUser message: "${message}"` }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err) {
    console.error('ai-chat error:', err)
    return NextResponse.json({
      type: 'unknown',
      message: 'Could not understand that. Try: "add rent $1500 recurring on the 2nd"',
    })
  }
}
