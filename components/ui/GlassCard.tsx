'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  glow?: string
  className?: string
}

export default function GlassCard({ glow, className, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('glass p-4 relative overflow-hidden', className)}
      style={glow ? { boxShadow: `0 0 24px ${glow}20, inset 0 0 24px ${glow}08` } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}
