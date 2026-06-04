'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, CheckSquare, Calendar, DollarSign, Dumbbell, Settings } from 'lucide-react'

const tabs = [
  { href: '/home',     icon: Home,        label: 'Home' },
  { href: '/planner',  icon: CheckSquare, label: 'Planner' },
  { href: '/calendar', icon: Calendar,    label: 'Calendar' },
  { href: '/budget',   icon: DollarSign,  label: 'Budget' },
  { href: '/fitness',  icon: Dumbbell,    label: 'Fitness' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                    bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA]
                    safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 flex-1 py-1">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex items-center justify-center w-10 h-10"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-[#1560FF]/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  className={active ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </motion.div>
              <span className={`text-[10px] font-medium tracking-wide
                ${active ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
        {(() => {
          const settingsActive = pathname === '/settings'
          return (
            <Link href="/settings" className="flex flex-col items-center gap-1 flex-1 py-1">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex items-center justify-center w-10 h-10"
              >
                {settingsActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-[#1560FF]/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Settings
                  size={20}
                  className={settingsActive ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}
                  strokeWidth={settingsActive ? 2.2 : 1.8}
                />
              </motion.div>
              <span className={`text-[10px] font-medium tracking-wide ${settingsActive ? 'text-[#1560FF]' : 'text-[#AEAEB2]'}`}>
                Settings
              </span>
            </Link>
          )
        })()}
      </div>
    </nav>
  )
}
