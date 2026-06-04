'use client'
import { CheckSquare, Bell, Dumbbell, Target, Apple, DollarSign, Calendar, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CHIPS = [
  { icon: CheckSquare, label: 'Add Task',    hint: 'Add task: ',    route: null },
  { icon: Bell,        label: 'Reminder',    hint: 'Remind me to ', route: null },
  { icon: Dumbbell,    label: 'Log Workout', hint: 'Gym today ',    route: null },
  { icon: Target,      label: 'Set Goal',    hint: 'Goal: ',        route: null },
  { icon: Apple,       label: 'Log Meal',    hint: 'Ate ',          route: null },
  { icon: DollarSign,  label: 'Add Expense', hint: 'Spent $',       route: null },
  { icon: Calendar,    label: 'Calendar',    hint: null,            route: '/calendar' },
  { icon: Building2,   label: 'CRM',         hint: null,            route: '/planner' },
]

interface QuickActionChipsProps {
  onChipTap: (hint: string) => void
}

export default function QuickActionChips({ onChipTap }: QuickActionChipsProps) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CHIPS.map(({ icon: Icon, label, hint, route }) => (
        <button
          key={label}
          type="button"
          onClick={() => route ? router.push(route) : hint && onChipTap(hint)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white
                     border border-[#E5E5EA] text-[#1D1D1F] text-xs font-medium
                     shadow-sm active:scale-95 transition-transform"
        >
          <Icon size={12} className="text-[#6E6E73]" />
          {label}
        </button>
      ))}
    </div>
  )
}
