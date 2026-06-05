'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFitnessStore } from '@/store/fitness'
import GymChecklist from './GymChecklist'
import { Pencil, Check, Plus, X } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DAY_TYPES = ['Push Day', 'Pull Day', 'Legs Day', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'Rest Day']

export default function WorkoutSchedule() {
  const { workoutSchedule, addExercise, removeExercise, setDayType } = useFitnessStore()
  const todayIdx = (new Date().getDay() + 6) % 7
  const [selected, setSelected] = useState<typeof DAYS[number]>(DAYS[todayIdx])
  const [editing, setEditing] = useState(false)

  // New exercise form state
  const [exName, setExName] = useState('')
  const [exSets, setExSets] = useState('3')
  const [exReps, setExReps] = useState('10')
  const [exWeight, setExWeight] = useState('0')

  const selectedDay = workoutSchedule.find((d) => d.day === selected)

  const handleAddExercise = () => {
    if (!exName.trim()) return
    addExercise(selected, {
      name: exName.trim(),
      sets: Number(exSets) || 3,
      reps: Number(exReps) || 10,
      weight: Number(exWeight) || 0,
    })
    setExName('')
    setExSets('3')
    setExReps('10')
    setExWeight('0')
  }

  return (
    <div className="apple-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
          Workout Schedule
        </p>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors
            ${editing ? 'bg-[#00d084]/15 text-[#00d084]' : 'bg-[#F5F5F7] text-[#6E6E73]'}`}
        >
          {editing ? <><Check size={11} /> Done</> : <><Pencil size={11} /> Edit</>}
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {workoutSchedule.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelected(d.day)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl transition-colors min-w-[48px]
              ${selected === d.day ? 'bg-[#1560FF] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'}`}
          >
            <span className="text-xs font-semibold">{d.day}</span>
            <span className="text-[9px] mt-0.5 opacity-80">{d.type.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {selectedDay && (
        <div>
          {/* Day type */}
          {editing ? (
            <div className="mb-3">
              <p className="text-[10px] text-[#6E6E73] mb-1.5">Day type</p>
              <div className="flex flex-wrap gap-1.5">
                {DAY_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDayType(selected, t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                      ${selectedDay.type === t
                        ? 'bg-[#1560FF] text-white'
                        : 'bg-[#F5F5F7] text-[#6E6E73]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#1D1D1F] mb-3">{selectedDay.type}</p>
          )}

          {/* Exercise list */}
          {selectedDay.exercises.length > 0 ? (
            <GymChecklist
              day={selectedDay.day}
              exercises={selectedDay.exercises}
              editing={editing}
              onRemove={(name) => removeExercise(selected, name)}
            />
          ) : (
            <p className="text-[#6E6E73] text-sm text-center py-4">
              {editing ? 'Add exercises below' : 'Rest day — recover and recharge 💪'}
            </p>
          )}

          {/* Add exercise form */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="border-t border-[#E5E5EA] pt-3 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">Add Exercise</p>
                  <input
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2.5
                               text-sm text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:border-[#1560FF]/50"
                    placeholder="Exercise name"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                    autoCapitalize="words"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Sets', val: exSets, set: setExSets },
                      { label: 'Reps', val: exReps, set: setExReps },
                      { label: 'lbs', val: exWeight, set: setExWeight },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <p className="text-[10px] text-[#6E6E73] mb-1">{label}</p>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2
                                     text-sm text-[#1D1D1F] outline-none focus:border-[#1560FF]/50 text-center font-mono"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddExercise}
                    disabled={!exName.trim()}
                    className="w-full bg-[#1560FF] text-white text-sm font-semibold py-2.5 rounded-xl
                               active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Exercise
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
