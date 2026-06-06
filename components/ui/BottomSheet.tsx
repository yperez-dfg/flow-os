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
                       bg-white border-t border-[#E5E5EA] rounded-t-3xl safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="w-10 h-1 bg-[#C6C6C8] rounded-full mx-auto mt-3 mb-2" />
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#E5E5EA]">
                <h3 className="font-display font-bold text-lg text-[#1D1D1F]">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="px-5 py-4 pb-8 max-h-[80vh] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
