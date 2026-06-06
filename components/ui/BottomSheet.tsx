'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Pinned outside the scroll area — submit buttons go here, always visible */
  footer?: React.ReactNode
}

export default function BottomSheet({
  open, onClose, title, children, footer,
}: BottomSheetProps) {
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [panelMaxH, setPanelMaxH] = useState('92dvh')

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function update() {
      // How far the keyboard has pushed the visual viewport up
      const kbH = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop)
      setKeyboardOffset(kbH)
      // Panel must fit within the remaining visible area
      const available = Math.max(200, vv!.height - 16)
      setPanelMaxH(`${available}px`)
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setKeyboardOffset(0)
      setPanelMaxH('92dvh')
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Sheet — flex-col so footer is always pinned at bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70]
                       bg-white border-t border-[#E5E5EA] rounded-t-3xl
                       shadow-[0_-4px_32px_rgba(0,0,0,0.12)]
                       flex flex-col"
            style={{ bottom: keyboardOffset, maxHeight: panelMaxH }}
          >
            {/* Drag handle — never scrolls */}
            <div className="flex-shrink-0 w-10 h-1 bg-[#C6C6C8] rounded-full mx-auto mt-3 mb-2" />

            {/* Header — never scrolls */}
            {title && (
              <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-[#E5E5EA]">
                <h3 className="font-display font-bold text-lg text-[#1D1D1F]">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-[#6E6E73] active:text-[#1D1D1F] transition-colors p-2 -mr-2 rounded-full"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Scrollable content — flex-1 so it fills space between header and footer */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {children}
            </div>

            {/* Pinned footer — NEVER scrolls away, submit button lives here */}
            {footer && (
              <div
                className="flex-shrink-0 px-5 pt-3 border-t border-[#F2F2F7]"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
