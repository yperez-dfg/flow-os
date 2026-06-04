'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WhiteCardProps extends HTMLMotionProps<'div'> {
  accent?: string
  glow?: string
  className?: string
}

export default function GlassCard({ accent, glow, className, children, ...props }: WhiteCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('apple-card p-4 relative overflow-hidden', className)}
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}
