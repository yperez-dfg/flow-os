'use client'
import { useState } from 'react'
import { useFitnessStore } from '@/store/fitness'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function WeightChart() {
  const { weighIns, goalWeight, addWeighIn } = useFitnessStore()
  const [input, setInput] = useState('')

  const data = weighIns.slice(-30).map((w) => ({
    date: w.date.slice(5),
    weight: w.weight,
  }))

  const current = weighIns.at(-1)?.weight ?? null

  const handleLog = () => {
    const num = Number(input)
    if (!input || isNaN(num) || num <= 0) return
    addWeighIn(num)
    setInput('')
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">
            Weight
          </p>
          {current !== null && (
            <p className="font-display text-2xl font-bold text-[#edeef2]">
              {current}{' '}
              <span className="text-sm text-[#8a8f9a] font-normal">lbs</span>
            </p>
          )}
          <p className="text-[10px] text-[#8a8f9a]">Goal: {goalWeight} lbs</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            inputMode="decimal"
            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5
                       text-sm text-[#edeef2] outline-none font-mono text-center
                       focus:border-[#00d084]/50"
            placeholder="lbs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
          />
          <button
            onClick={handleLog}
            className="bg-[#00d084]/20 text-[#00d084] px-3 py-1.5 rounded-lg text-xs font-semibold
                       active:scale-95 transition-transform"
          >
            Log
          </button>
        </div>
      </div>
      {data.length > 1 && (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{
                background: '#0A0C18',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#8a8f9a', fontSize: 10 }}
              itemStyle={{ color: '#00d084' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#00d084"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00d084' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {data.length <= 1 && (
        <p className="text-[#8a8f9a] text-xs text-center py-4">
          Log 2+ weigh-ins to see your chart
        </p>
      )}
    </div>
  )
}
