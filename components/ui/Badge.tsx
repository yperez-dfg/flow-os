import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  blue:   'bg-[#1560FF]/15 text-[#1560FF] border-[#1560FF]/20',
  green:  'bg-[#00d084]/15 text-[#00d084] border-[#00d084]/20',
  amber:  'bg-[#ffb547]/15 text-[#ffb547] border-[#ffb547]/20',
  purple: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/20',
  red:    'bg-[#ff4d6a]/15 text-[#ff4d6a] border-[#ff4d6a]/20',
  cyan:   'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/20',
  slate:  'bg-white/[0.06] text-[#8a8f9a] border-white/[0.08]',
}

interface BadgeProps {
  label: string
  color?: keyof typeof colorMap
  className?: string
}

export default function Badge({ label, color = 'slate', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border font-mono',
        colorMap[color],
        className
      )}
    >
      {label}
    </span>
  )
}
