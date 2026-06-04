'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                       bg-[#0A0C18] border-t border-white/[0.08] rounded-t-3xl safe-bottom"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.06]">
                <h3 className="font-display font-bold text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-[#8a8f9a] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
