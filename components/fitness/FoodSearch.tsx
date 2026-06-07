'use client'
import { useState, useCallback } from 'react'
import { searchFood, type FoodResult } from '@/lib/usda-api'
import { useFitnessStore } from '@/store/fitness'
import { Search, Loader2, Check, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomSheet from '@/components/ui/BottomSheet'

type Mode = 'usda' | 'ai'

interface AIEstimate {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: 'high' | 'medium' | 'low'
}

const PRESETS = [50, 100, 150, 200, 250]

function scaleMacro(base: number, factor: number) {
  return Math.round(base * factor)
}

export default function FoodSearch() {
  const { addMeal } = useFitnessStore()
  const [mode, setMode] = useState<Mode>('usda')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [aiEstimate, setAiEstimate] = useState<AIEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [loggedId, setLoggedId] = useState<number | string | null>(null)
  const [error, setError] = useState('')

  // Serving size sheet (USDA flow — adjusted in grams)
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [grams, setGrams] = useState(100)
  const [usdaSheetOpen, setUsdaSheetOpen] = useState(false)

  // AI estimate sheet (multiply by # servings)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [servings, setServings] = useState(1)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    setAiEstimate(null)
    setError('')
    try {
      if (mode === 'usda') {
        const data = await searchFood(query)
        setResults(data)
        if (data.length === 0) setError('No USDA matches. Try AI mode for restaurant items.')
      } else {
        const res = await fetch('/api/food-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: query }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setAiEstimate(data)
        // Auto-open the sheet for AI flow
        setServings(1)
        setAiSheetOpen(true)
      }
    } catch {
      setError('Could not fetch nutrition. Try again.')
    } finally {
      setLoading(false)
    }
  }, [query, mode])

  function selectFood(food: FoodResult) {
    setSelected(food)
    setGrams(100)
    setUsdaSheetOpen(true)
  }

  function handleLogUSDA() {
    if (!selected) return
    const factor = grams / 100
    addMeal({
      name: selected.description.split(',')[0],
      calories: scaleMacro(selected.calories, factor),
      protein:  scaleMacro(selected.protein,  factor),
      carbs:    scaleMacro(selected.carbs,     factor),
      fat:      scaleMacro(selected.fat,       factor),
      time: new Date().toTimeString().slice(0, 5),
    })
    setLoggedId(selected.fdcId)
    setUsdaSheetOpen(false)
    setTimeout(() => setLoggedId(null), 2000)
  }

  function handleLogAI() {
    if (!aiEstimate) return
    addMeal({
      name: aiEstimate.name,
      calories: scaleMacro(aiEstimate.calories, servings),
      protein:  scaleMacro(aiEstimate.protein,  servings),
      carbs:    scaleMacro(aiEstimate.carbs,    servings),
      fat:      scaleMacro(aiEstimate.fat,      servings),
      time: new Date().toTimeString().slice(0, 5),
    })
    setLoggedId(aiEstimate.name)
    setAiSheetOpen(false)
    setQuery('')
    setAiEstimate(null)
    setTimeout(() => setLoggedId(null), 2000)
  }

  const usdaScaled = selected ? {
    cal:     scaleMacro(selected.calories, grams / 100),
    protein: scaleMacro(selected.protein,  grams / 100),
    carbs:   scaleMacro(selected.carbs,    grams / 100),
    fat:     scaleMacro(selected.fat,      grams / 100),
  } : null

  const aiScaled = aiEstimate ? {
    cal:     scaleMacro(aiEstimate.calories, servings),
    protein: scaleMacro(aiEstimate.protein,  servings),
    carbs:   scaleMacro(aiEstimate.carbs,    servings),
    fat:     scaleMacro(aiEstimate.fat,      servings),
  } : null

  return (
    <div className="apple-card p-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-[#F5F5F7] rounded-2xl mb-3">
        <button
          onClick={() => { setMode('usda'); setError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5
            ${mode === 'usda' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73]'}`}
        >
          <Search size={13} />
          USDA Database
        </button>
        <button
          onClick={() => { setMode('ai'); setError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5
            ${mode === 'ai' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73]'}`}
        >
          <Sparkles size={13} />
          AI · Restaurants
        </button>
      </div>

      <p className="text-[10px] text-[#6E6E73] mb-3">
        {mode === 'usda'
          ? 'Whole foods, ingredients, basics'
          : 'Describe any meal — chain restaurant, homemade, anything'}
      </p>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3
                     text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF] text-base"
          placeholder={mode === 'usda'
            ? 'chicken breast, banana, oatmeal…'
            : 'Chipotle bowl, double honey chicken, rice…'}
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
          className={`w-14 text-white rounded-xl active:scale-95 transition-transform
                     disabled:opacity-50 flex items-center justify-center
                     ${mode === 'ai' ? 'bg-[#a855f7]' : 'bg-[#1560FF]'}`}
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : mode === 'ai' ? <Sparkles size={18} /> : <Search size={18} />}
        </button>
      </div>

      {error && <p className="text-[11px] text-[#6E6E73] text-center py-2">{error}</p>}

      {/* USDA Results */}
      <AnimatePresence>
        {mode === 'usda' && results.length > 0 && (
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

      {/* USDA serving sheet */}
      <BottomSheet
        open={usdaSheetOpen}
        onClose={() => setUsdaSheetOpen(false)}
        title="Adjust Serving"
        footer={
          <button
            onClick={handleLogUSDA}
            className="w-full bg-[#00d084] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
          >
            Log {usdaScaled?.cal} cal
          </button>
        }
      >
        {selected && usdaScaled && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-[#1D1D1F] text-base leading-snug">
                {selected.description.split(',')[0]}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-0.5 truncate">
                {selected.description.split(',').slice(1, 3).join(',').trim()}
              </p>
            </div>

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

            <MacroGrid label={`Nutrition for ${grams}g`} {...usdaScaled} />
          </div>
        )}
      </BottomSheet>

      {/* AI estimate sheet */}
      <BottomSheet
        open={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        title="AI Estimate"
        footer={
          <button
            onClick={handleLogAI}
            className="w-full bg-[#a855f7] text-white font-semibold py-4 rounded-2xl active:scale-95 transition-transform text-base"
          >
            Log {aiScaled?.cal} cal
          </button>
        }
      >
        {aiEstimate && aiScaled && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-[#a855f7]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7]">
                  AI Estimated
                </span>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ml-auto
                    ${aiEstimate.confidence === 'high'   ? 'bg-[#00d084]/15 text-[#00d084]'
                    : aiEstimate.confidence === 'medium' ? 'bg-[#FF9F0A]/15 text-[#FF9F0A]'
                    :                                       'bg-[#8E8E93]/15 text-[#8E8E93]'}`}
                >
                  {aiEstimate.confidence}
                </span>
              </div>
              <p className="font-semibold text-[#1D1D1F] text-base leading-snug">
                {aiEstimate.name}
              </p>
              <p className="text-[10px] text-[#AEAEB2] mt-1">
                Per serving as described
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
                Servings
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(s => Math.max(0.25, +(s - 0.25).toFixed(2)))}
                  className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center text-xl font-light active:scale-90"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.25}
                  min={0.25}
                  value={servings}
                  onChange={e => setServings(Math.max(0.25, Number(e.target.value) || 0.25))}
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 py-4
                             text-[#1D1D1F] outline-none focus:border-[#a855f7]/60 text-base font-mono text-center"
                />
                <button
                  onClick={() => setServings(s => +(s + 0.25).toFixed(2))}
                  className="w-12 h-12 rounded-full bg-[#a855f7] text-white flex items-center justify-center text-xl font-light active:scale-90"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-[#AEAEB2] mt-2 text-center">
                Use fractions for half-portions (0.5, 1.5…)
              </p>
            </div>

            <MacroGrid label={`Total · ${servings}x serving`} {...aiScaled} />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function MacroGrid({ label, cal, protein, carbs, fat }: {
  label: string; cal: number; protein: number; carbs: number; fat: number
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', val: cal,     unit: 'kcal', color: '#1560FF' },
          { label: 'Protein',  val: protein, unit: 'g',    color: '#00d084' },
          { label: 'Carbs',    val: carbs,   unit: 'g',    color: '#FF9F0A' },
          { label: 'Fat',      val: fat,     unit: 'g',    color: '#a855f7' },
        ].map(({ label, val, unit, color }) => (
          <div key={label} className="bg-[#F5F5F7] rounded-2xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-[#1D1D1F]">{val}</p>
            <p className="text-[9px] text-[#AEAEB2] font-mono">{unit}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
