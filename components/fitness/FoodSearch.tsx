'use client'
import { useState, useCallback } from 'react'
import { searchFood, type FoodResult } from '@/lib/usda-api'
import { useFitnessStore } from '@/store/fitness'
import { Search, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomSheet from '@/components/ui/BottomSheet'

// Quick preset buttons for common serving sizes
const PRESETS = [50, 100, 150, 200, 250]

function scaleMacro(base: number, grams: number) {
  return Math.round((base / 100) * grams)
}

export default function FoodSearch() {
  const { addMeal } = useFitnessStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loggedId, setLoggedId] = useState<number | null>(null)

  // Serving size sheet
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [grams, setGrams] = useState(100)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  function selectFood(food: FoodResult) {
    setSelected(food)
    setGrams(100)
    setSheetOpen(true)
  }

  function handleLog() {
    if (!selected) return
    addMeal({
      name: selected.description.split(',')[0],
      calories: scaleMacro(selected.calories, grams),
      protein:  scaleMacro(selected.protein,  grams),
      carbs:    scaleMacro(selected.carbs,     grams),
      fat:      scaleMacro(selected.fat,       grams),
      time: new Date().toTimeString().slice(0, 5),
    })
    setLoggedId(selected.fdcId)
    setSheetOpen(false)
    setTimeout(() => setLoggedId(null), 2000)
  }

  // Live-scaled macros
  const scaled = selected
    ? {
        cal:     scaleMacro(selected.calories, grams),
        protein: scaleMacro(selected.protein,  grams),
        carbs:   scaleMacro(selected.carbs,    grams),
        fat:     scaleMacro(selected.fat,      grams),
      }
    : null

  return (
    <div className="apple-card p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
        Search Food · USDA Database
      </p>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                     text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF] text-base"
          placeholder="chicken breast, banana, oatmeal…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-14 bg-[#1560FF] text-white rounded-xl active:scale-95 transition-transform
                     disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(food => (
              <motion.button
                key={food.fdcId}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => selectFood(food)}
                className="w-full flex items-center gap-3 p-3.5 bg-[#F5F5F7] rounded-xl active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1D1D1F] truncate">
                    {food.description.split(',')[0]}
                  </p>
                  <p className="text-[10px] font-mono text-[#6E6E73] mt-0.5">
                    {food.calories} cal · {food.protein}g P · {food.carbs}g C · {food.fat}g F
                    <span className="text-[#AEAEB2]"> per 100g</span>
                  </p>
                </div>
                {loggedId === food.fdcId ? (
                  <div className="w-8 h-8 rounded-full bg-[#00d084] flex items-center justify-center flex-shrink-0">
                    <Check size={15} className="text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1560FF] text-lg font-light leading-none">+</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Serving size sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Adjust Serving"
        footer={
          <button
            onClick={handleLog}
            className="w-full bg-[#00d084] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
          >
            Log {scaled?.cal} cal
          </button>
        }
      >
        {selected && scaled && (
          <div className="space-y-5">
            {/* Food name */}
            <div>
              <p className="font-semibold text-[#1D1D1F] text-base leading-snug">
                {selected.description.split(',')[0]}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-0.5 truncate">
                {selected.description.split(',').slice(1, 3).join(',').trim()}
              </p>
            </div>

            {/* Serving size input */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                Serving Size
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={2000}
                  value={grams}
                  onChange={e => setGrams(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                             text-[#1D1D1F] outline-none focus:border-[#1560FF]/60 text-base font-mono text-center"
                />
                <span className="text-sm text-[#6E6E73] font-medium">grams</span>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {PRESETS.map(g => (
                  <button
                    key={g}
                    onClick={() => setGrams(g)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors
                      ${grams === g
                        ? 'bg-[#1560FF] border-[#1560FF] text-white'
                        : 'border-[#E5E5EA] text-[#6E6E73] bg-[#F5F5F7]'}`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* Live macro breakdown */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
                Nutrition for {grams}g
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Calories', val: scaled.cal,     unit: 'kcal', color: '#1560FF' },
                  { label: 'Protein',  val: scaled.protein, unit: 'g',    color: '#00d084' },
                  { label: 'Carbs',    val: scaled.carbs,   unit: 'g',    color: '#FF9F0A' },
                  { label: 'Fat',      val: scaled.fat,     unit: 'g',    color: '#a855f7' },
                ].map(({ label, val, unit, color }) => (
                  <div key={label} className="bg-[#F5F5F7] rounded-2xl p-3 text-center">
                    <p className="font-mono font-bold text-lg text-[#1D1D1F]">{val}</p>
                    <p className="text-[9px] text-[#AEAEB2] font-mono">{unit}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
