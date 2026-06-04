'use client'
import { useBudgetStore } from '@/store/budget'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

export default function SpendingChart() {
  const { categories, spentByCategory } = useBudgetStore()
  const spent = spentByCategory()

  const data = categories.map((c) => ({
    name: c.name,
    spent: spent[c.name] ?? 0,
    cap: c.cap,
    color: c.color,
    pct: c.cap > 0 ? Math.min(((spent[c.name] ?? 0) / c.cap) * 100, 100) : 0,
  }))

  if (data.length === 0) return null

  return (
    <div className="apple-card p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-4">
        Spending by Category
      </p>
      <ResponsiveContainer width="100%" height={data.length * 44}>
        <BarChart data={data} layout="vertical" barSize={8} barCategoryGap={16}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: '#6E6E73', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="cap" fill="rgba(0,0,0,0.06)" radius={4} isAnimationActive={false} />
          <Bar dataKey="spent" radius={4}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.pct >= 100 ? '#ff4d6a' : d.pct >= 80 ? '#ffb547' : d.color}
              />
            ))}
            <LabelList
              dataKey="spent"
              position="right"
              formatter={(v: unknown) => `$${v as number}`}
              style={{ fill: '#6E6E73', fontSize: 10, fontFamily: 'ui-monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
