'use client'
import { useEffect, useState } from 'react'
import { fetchCRMStats } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface CRMStats {
  openLeads: number
  activeClients: number
  mrr: number
  tasksDueToday: number
  overdueInvoiceTotal: number
  overdueCount: number
}

export default function CRMStatsGrid() {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCRMStats()
      .then((s) => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass p-4 h-20 animate-pulse bg-white/[0.02]" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="glass p-4 text-center">
        <p className="text-[#8a8f9a] text-sm">Unable to load CRM data</p>
      </div>
    )
  }

  const pills = [
    { label: 'Open Leads',     value: stats.openLeads,                            color: '#1560FF' },
    { label: 'Active Clients', value: stats.activeClients,                        color: '#00d084' },
    { label: 'MRR',            value: `$${stats.mrr.toLocaleString()}`,            color: '#00d4ff' },
    { label: 'Due Today',      value: stats.tasksDueToday,                        color: '#a855f7' },
    ...(stats.overdueCount > 0
      ? [{ label: 'Overdue',   value: `$${stats.overdueInvoiceTotal.toLocaleString()}`, color: '#ff4d6a' }]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {pills.map((p, i) => (
        <motion.div
          key={p.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
          className="glass p-4"
          style={{ boxShadow: `0 0 20px ${p.color}18, inset 0 0 20px ${p.color}06` }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-1">
            {p.label}
          </p>
          <p className="font-display text-2xl font-bold" style={{ color: p.color }}>
            {p.value}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
