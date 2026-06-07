import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a B2B sales coach for a digital agency offering web development, growth marketing, and foundation packages.
Given a lead's status, recommend the single best next action.
Return ONLY valid JSON: { "action": "...", "urgency": "high|medium|low", "message_draft": "...", "reason": "..." }
Rules:
- action: under 10 words, imperative
- message_draft: ready to send, conversational, under 60 words, no placeholders
- urgency: high if 5+ days since contact or deal is closing, medium otherwise, low if new lead
- reason: one sentence explaining timing`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })

  const body = await req.json()

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
          { role: 'user', content: JSON.stringify(body) },
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const text: string = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('crm-coach error:', err)
    return NextResponse.json({ error: 'Failed to get coaching' }, { status: 500 })
  }
}
