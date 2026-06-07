import { NextRequest, NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a nutrition database. The user describes a food (often a restaurant item like "Chipotle bowl with double honey chipotle chicken, rice, black beans, guac").
Return ONLY a JSON object with realistic estimated nutrition for the WHOLE described item as ordered (not per 100g).
Shape:
{
  "name": "Short descriptive name (max 60 chars)",
  "calories": <number>,
  "protein": <number, grams>,
  "carbs": <number, grams>,
  "fat": <number, grams>,
  "confidence": "high|medium|low"
}
Rules:
- Use real chain-restaurant nutrition data when known (Chipotle, McDonald's, Starbucks, Subway, Chick-fil-A, Panera, Sweetgreen, etc.)
- "Double protein" = 2x the protein portion's macros
- Include all described add-ons (guac, sauces, dressings, cheese)
- Confidence: "high" for well-known chain items, "medium" for generic restaurant food, "low" for vague descriptions
- If completely unclear, return calories: 0 and confidence: "low"
- Round all macro numbers to whole integers`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  const { description } = await req.json()
  if (!description?.trim()) {
    return NextResponse.json({ error: 'No description' }, { status: 400 })
  }

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
          { role: 'user', content: description },
        ],
        temperature: 0.2,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('food-estimate Groq error:', data)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const text: string = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) return NextResponse.json({ error: 'Empty response' }, { status: 500 })

    return NextResponse.json(JSON.parse(text))
  } catch (err) {
    console.error('food-estimate error:', err)
    return NextResponse.json({ error: 'Failed to estimate' }, { status: 500 })
  }
}
