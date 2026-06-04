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

export function getStoredSubscription() {
  return storedSubscription
}

export function setStoredSubscription(sub: webpush.PushSubscription | null) {
  storedSubscription = sub
}

export { webpush }
