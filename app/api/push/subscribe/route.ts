import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure VAPID — runs once when module loads
if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Single-user: store in module memory (resets on cold start — fine for personal app)
let storedSubscription: webpush.PushSubscription | null = null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    storedSubscription = body.subscription as webpush.PushSubscription
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ hasSubscription: !!storedSubscription })
}

// Export for other server routes to send pushes (Phase 2 cron will use this)
export { storedSubscription, webpush }
