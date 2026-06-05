'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpIcon, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlannerStore } from '@/store/planner'
import { useCalendarStore } from '@/store/calendar'
import { useBudgetStore } from '@/store/budget'
import { useFitnessStore } from '@/store/fitness'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface AIChatInputProps {
  externalValue?: string
  onExternalValueConsumed?: () => void
}

export default function AIChatInput({ externalValue, onExternalValueConsumed }: AIChatInputProps) {
  const [message, setMessage] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { addTask, addGoal } = usePlannerStore()
  const { addEvent } = useCalendarStore()
  const { addTransaction, addRecurringExpense, categories } = useBudgetStore()
  const { addMeal } = useFitnessStore()

  // Accept external value from quick-action chips
  useEffect(() => {
    if (externalValue) {
      setMessage(externalValue)
      onExternalValueConsumed?.()
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [externalValue, onExternalValueConsumed])

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '48px'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [])

  useEffect(() => { adjustHeight() }, [message, adjustHeight])

  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message: msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }

  const handleSubmit = async () => {
    if (!message.trim()) return
    const text = message.trim()
    setMessage('')
    if (textareaRef.current) textareaRef.current.style.height = '48px'

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const result = await res.json()

      switch (result.type) {
        case 'task':
          addTask(result.data)
          showToast(`✓ Task added: ${result.data.title}`)
          break
        case 'reminder':
          addEvent(result.data)
          showToast(`✓ Reminder set: ${result.data.title}`)
          break
        case 'goal':
          addGoal({ ...result.data, weekOf: new Date().toISOString().split('T')[0] })
          showToast(`✓ Goal created: ${result.data.title}`)
          break
        case 'expense':
          addTransaction(result.data)
          showToast(`✓ Expense added: $${result.data.amount}`)
          break
        default:
          showToast(result.message ?? 'Try: "remind me to call Carlos at 3pm"', 'error')
      }
    } catch {
      showToast('Something went wrong. Try again.', 'error')
    }
  }

  const handleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      showToast('Voice not supported in this browser', 'error')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any
    recognition.lang = 'en-US'
    recognition.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      setMessage(e.results[0][0].transcript)
    }
    recognition.start()
  }

  return (
    <div className="relative">
      {/* Toast notifications */}
      <div
        className="absolute left-0 right-0 flex flex-col gap-2 pointer-events-none"
        style={{ bottom: '100%', marginBottom: 8 }}
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                'mx-auto px-4 py-2 rounded-full text-sm font-medium shadow-lg',
                t.type === 'success'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#ff4d6a]/10 text-[#cc0022] border border-[#ff4d6a]/20'
              )}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input card */}
      <div className="apple-card overflow-hidden">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => { setMessage(e.target.value); adjustHeight() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Add a task, set a reminder, log a meal..."
          className="w-full px-4 pt-3 pb-1 resize-none bg-transparent text-[#1D1D1F] text-sm
                     placeholder-[#AEAEB2] outline-none min-h-[48px]"
          style={{ overflow: 'hidden' }}
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <button
            onClick={handleVoice}
            className="p-2 rounded-full text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            type="button"
          >
            <Mic size={16} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            type="button"
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              message.trim()
                ? 'bg-[#1560FF] text-white shadow-sm active:scale-90'
                : 'bg-[#F5F5F7] text-[#AEAEB2] cursor-not-allowed'
            )}
          >
            <ArrowUpIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
