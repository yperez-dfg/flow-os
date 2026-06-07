import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildSystem(today: string) {
  return `You are FlowOS, a smart personal assistant embedded in a productivity app.
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

CRM activity note (call, email, meeting, SMS, general note):
{ "type": "crm_note", "data": { "related": "...", "content": "...", "activityType": "call|email|meeting|note|sms" } }

New CRM lead:
{ "type": "crm_lead", "data": { "name": "...", "business": "...", "phone": "...", "source": "...", "service": "Full Stack|Growth|Foundation", "value": <number> } }

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
- "Called John at Marcus LLC, left voicemail" → crm_note, activityType: "call"
- "New lead: Sarah from Bloom Bakery, wants website, $2500" → crm_lead
- "Emailed proposal to Marcus" → crm_note, activityType: "email"
- Multiple recurring bills in one message → multiple items in the items array
- Infer category from context: rent/mortgage → "Rent", netflix/spotify/gym → "Subscriptions", uber/gas → "Gas"
- If truly unclear, return unknown`
}

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ type: 'unknown', message: 'AI not configured.' })

  const today = new Date().toISOString().split('T')[0]
  const { message } = await req.json()

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
          { role: 'system', content: buildSystem(today) },
          { role: 'user', content: message },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Groq API error:', data)
      return NextResponse.json({ type: 'unknown', message: 'AI error. Try again in a moment.' })
    }

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) {
      console.error('ai-chat: empty Groq response', JSON.stringify(data))
      return NextResponse.json({ type: 'unknown', message: 'No response from AI. Try rephrasing.' })
    }

    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('ai-chat error:', err)
    return NextResponse.json({
      type: 'unknown',
      message: 'Could not understand that. Try: "add task call John" or "spent $40 on food"',
    })
  }
}
