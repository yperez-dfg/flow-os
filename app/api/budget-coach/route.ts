import { NextRequest } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are a personal finance coach. Analyze this month's spending and give specific, actionable advice.
Be direct — name dollar amounts, category names, and specific actions.
Format your response as:

HEALTH: green|yellow|red
SUMMARY: one sentence
ANOMALIES:
- [specific observation with dollar amounts]
ACTIONS:
- [specific action with dollar amounts]

Rules:
- Max 3 anomalies, max 3 actions
- Reference actual category names from the data
- "Misc" charges over $20 are worth investigating
- Compare spent vs cap for each category`

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY
  if (!key) return new Response('GROQ_API_KEY not set', { status: 500 })

  const body = await req.json()

  const stream = new ReadableStream({
    async start(controller) {
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
            temperature: 0.3,
            max_tokens: 512,
            stream: true,
          }),
        })

        if (!res.ok || !res.body) {
          controller.enqueue(new TextEncoder().encode('Could not analyze budget.'))
          controller.close()
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const text = parsed.choices?.[0]?.delta?.content ?? ''
              if (text) controller.enqueue(new TextEncoder().encode(text))
            } catch { /* skip malformed SSE */ }
          }
        }
        controller.close()
      } catch {
        controller.enqueue(new TextEncoder().encode('Error analyzing budget.'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
