'use client'
import { useState, useCallback } from 'react'
import { searchFood, type FoodResult } from '@/lib/usda-api'
import { useFitnessStore } from '@/store/fitness'
import { Search, Loader2, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FoodSearch() {
  const { addMeal } = useFitnessStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loggedId, setLoggedId] = useState<number | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      const data = await searchFood(query)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleLog = (food: FoodResult) => {
    addMeal({
      name: food.description.split(',')[0],
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: new Date().toTimeString().slice(0, 5),
    })
    setLoggedId(food.fdcId)
    setTimeout(() => setLoggedId(null), 2000)
  }

  return (
    <div className="apple-card p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
        Search Food · USDA Database
      </p>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5
                     text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF] text-sm"
          placeholder="chicken breast, banana, oatmeal..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-[#1560FF] text-white rounded-xl text-sm font-medium
                     active:scale-95 transition-transform disabled:opacity-50 flex items-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(food => (
              <motion.div
                key={food.fdcId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1D1D1F] truncate">
                    {food.description.split(',')[0]}
                  </p>
                  <p className="text-[10px] font-mono text-[#6E6E73]">
                    {food.calories} cal · {food.protein}g P · {food.carbs}g C · {food.fat}g F
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLog(food)}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                    loggedId === food.fdcId
                      ? 'bg-[#00d084] text-white'
                      : 'bg-white border border-[#E5E5EA] text-[#1560FF]'
                  }`}
                >
                  {loggedId === food.fdcId ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
