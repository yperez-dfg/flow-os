import { NextRequest, NextResponse } from 'next/server'
import { getStoredSubscription, setStoredSubscription } from '@/lib/push-store'
import type webpush from 'web-push'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    setStoredSubscription(body.subscription as webpush.PushSubscription)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ hasSubscription: !!getStoredSubscription() })
}
