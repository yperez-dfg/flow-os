'use client'
import { useEffect } from 'react'
import BottomNav from '@/components/nav/BottomNav'
import { requestNotificationPermission, subscribeToPush } from '@/lib/notifications'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Request notification permission and subscribe to push on first app load
    requestNotificationPermission().then((granted) => {
      if (granted) {
        subscribeToPush().then((sub) => {
          if (sub) {
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub }),
            }).catch(console.warn)
          }
        })
      }
    })
  }, [])

  return (
    <div className="relative min-h-screen bg-[#F5F5F7]">
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] safe-top min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
