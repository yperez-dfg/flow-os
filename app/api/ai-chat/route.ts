import { NextRequest, NextResponse } from 'next/server'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM = `You are FlowOS, a smart personal assistant. The user is typing a natural-language command to manage their day.
Parse the intent and return ONLY valid JSON — no markdown, no explanation — in one of these shapes:

Task:      { "type": "task",     "data": { "title": "...", "priority": "High|Medium|Low", "done": false, "repeat": "none" } }
Reminder:  { "type": "reminder", "data": { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "color": "#1560FF", "repeat": "none", "notify": true, "notifyMinutesBefore": 10, "type": "personal" } }
Goal:      { "type": "goal",     "data": { "title": "...", "target": <number>, "unit": "...", "current": 0, "weekOf": "YYYY-MM-DD" } }
Expense:   { "type": "expense",  "data": { "amount": <number>, "category": "...", "note": "...", "date": "YYYY-MM-DD", "type": "expense" } }
Unknown:   { "type": "unknown",  "message": "Brief friendly suggestion on what the user can try" }

Today's date: ${new Date().toISOString().split('T')[0]}
Use 24-hour times. Infer missing details sensibly.`

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ type: 'unknown', message: 'AI not configured' })

  const { message } = await req.json()

  const body = {
    contents: [{ parts: [{ text: `${SYSTEM}\n\nUser message: "${message}"` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
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
  } catch {
    return NextResponse.json({ type: 'unknown', message: 'Could not understand that. Try: "remind me to call Carlos at 3pm"' })
  }
}
