import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cmntmktwcrkqryuaocui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbnRta3R3Y3JrcXJ5dWFvY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTA4MjYsImV4cCI6MjA5NDY2NjgyNn0.-t8Y43M4QChlzfMKfbmxNjTwwdsK-1NmFaHtoOr7q7s'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Case helpers ────────────────────────────────────────────────
function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
}

function toSnakeStr(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function fromSnake<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[toCamel(k)] = v
  }
  return result as T
}

export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[toSnakeStr(k)] = v
  }
  return result
}

// ─── TypeScript interfaces (camelCase for app use) ───────────────
export interface Lead {
  id: number
  name: string
  business: string
  email: string
  phone: string
  source: string
  stage: 'New Lead' | 'Contacted' | 'Proposal Sent' | 'Follow-Up' | 'Meeting Scheduled' | 'No Answer' | 'Won' | 'Lost'
  service: 'Full Stack' | 'Growth' | 'Foundation'
  value: number
  notes: string
  date: string
  meetLink: string
  meetingDate: string
  meetingTime: string
  meetingTitle: string
}

export interface Client {
  id: number
  name: string
  business: string
  email: string
  phone: string
  tier: string
  monthly: number
  setup: number
  startDate: string
  services: string
  status: 'Active' | 'Paused'
  notes: string
}

export interface CRMTask {
  id: number
  title: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  related: string
  done: boolean
}

export interface Invoice {
  id: number
  client: string
  type: string
  amount: number
  issued: string
  due: string
  status: 'Paid' | 'Pending' | 'Overdue'
  paidDate: string
  notes: string
}

export interface Activity {
  id: number
  type: 'note' | 'call' | 'email' | 'meeting' | 'sms'
  related: string
  content: string
  date: string
  createdAt: string
}

// ─── CRM Stats query (used by Dashboard) ─────────────────────────
export async function fetchCRMStats() {
  const today = new Date().toISOString().split('T')[0]

  const [leadsRes, clientsRes, tasksRes, invoicesRes] = await Promise.all([
    sb.from('leads').select('id, stage').not('stage', 'in', '("Won","Lost")'),
    sb.from('clients').select('id, monthly, status').eq('status', 'Active'),
    sb.from('tasks').select('id, due, done').eq('done', false).lte('due', today),
    sb.from('invoices').select('id, amount, status').eq('status', 'Overdue'),
  ])

  const openLeads = leadsRes.data?.length ?? 0
  const activeClients = clientsRes.data?.length ?? 0
  const mrr = clientsRes.data?.reduce((sum, c) => sum + (c.monthly ?? 0), 0) ?? 0
  const tasksDueToday = tasksRes.data?.length ?? 0
  const overdueInvoiceTotal = invoicesRes.data?.reduce((sum, i) => sum + (i.amount ?? 0), 0) ?? 0
  const overdueCount = invoicesRes.data?.length ?? 0

  return { openLeads, activeClients, mrr, tasksDueToday, overdueInvoiceTotal, overdueCount }
}
