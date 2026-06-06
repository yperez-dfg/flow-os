'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  // Tracks how far up the sheet should sit above the bottom edge.
  // When the iOS keyboard opens, visualViewport shrinks and we push the
  // sheet up so it clears the keyboard — keeping the submit button visible.
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [maxH, setMaxH] = useState('80vh')
  const prevOpen = useRef(open)

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return

    function update() {
      const keyboardH = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop)
      setKeyboardOffset(keyboardH)
      // Shrink max height so content is never taller than the visible area above keyboard
      const available = vv!.height - 80 // 80px for sheet header / handle
      setMaxH(`${Math.max(200, available)}px`)
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Reset keyboard offset when sheet closes so it doesn't ghost
  useEffect(() => {
    if (!open && prevOpen.current) {
      setKeyboardOffset(0)
    }
    prevOpen.current = open
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                       bg-white border-t border-[#E5E5EA] rounded-t-3xl
                       shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
            style={{ bottom: keyboardOffset }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-[#C6C6C8] rounded-full mx-auto mt-3 mb-2" />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#E5E5EA]">
                <h3 className="font-display font-bold text-lg text-[#1D1D1F]">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-[#6E6E73] active:text-[#1D1D1F] transition-colors p-1 -mr-1"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Scrollable content — always scrollable so submit is reachable */}
            <div
              className="px-5 py-4 overflow-y-auto overscroll-contain"
              style={{
                maxHeight: maxH,
                // Real safe-area bottom padding so content clears the home indicator
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
