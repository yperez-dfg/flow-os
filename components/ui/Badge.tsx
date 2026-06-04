import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  blue:   'bg-[#1560FF]/10 text-[#1560FF] border-[#1560FF]/20',
  green:  'bg-[#00d084]/10 text-[#00a86b] border-[#00d084]/20',
  amber:  'bg-[#ffb547]/10 text-[#cc8800] border-[#ffb547]/20',
  purple: 'bg-[#a855f7]/10 text-[#7c3aed] border-[#a855f7]/20',
  red:    'bg-[#ff4d6a]/10 text-[#cc0022] border-[#ff4d6a]/20',
  cyan:   'bg-[#00d4ff]/10 text-[#0099cc] border-[#00d4ff]/20',
  slate:  'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA]',
}

interface BadgeProps {
  label: string
  color?: keyof typeof colorMap
  className?: string
}

export default function Badge({ label, color = 'slate', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border font-mono',
      colorMap[color],
      className
    )}>
      {label}
    </span>
  )
}
