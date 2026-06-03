import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#07080F]">
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))] safe-top min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
