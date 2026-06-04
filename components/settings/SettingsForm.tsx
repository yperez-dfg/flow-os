'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings'
import { sb } from '@/lib/supabase'
import GlassCard from '@/components/ui/GlassCard'
import { CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react'

type CRMStatus = 'idle' | 'loading' | 'ok' | 'error'

export default function SettingsForm() {
  const {
    userName,
    morningBriefTime,
    eveningReviewTime,
    autoAlarm,
    autoCRMSync,
    voiceInput,
    calorieGoal,
    weeklyBudgetCap,
    setSetting,
    setUserName,
  } = useSettingsStore()

  const [crmStatus, setCrmStatus] = useState<CRMStatus>('idle')
  const [copied, setCopied] = useState(false)

  const feedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/feed`
    : 'https://daily-planner-pi-ten.vercel.app/api/calendar/feed'

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testCRM = async () => {
    setCrmStatus('loading')
    try {
      const { error } = await sb.from('leads').select('id').limit(1)
      setCrmStatus(error ? 'error' : 'ok')
    } catch {
      setCrmStatus('error')
    }
    setTimeout(() => setCrmStatus('idle'), 4000)
  }

  return (
    <div className="space-y-4">
      {/* Profile */}
      <GlassCard className="p-0 divide-y divide-[#E5E5EA]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Profile
          </p>
        </div>
        <SettingRow label="Your Name">
          <input
            className="settings-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Yandel"
          />
        </SettingRow>
        <SettingRow label="Morning Briefing">
          <input
            type="time"
            className="settings-input"
            value={morningBriefTime}
            onChange={(e) => setSetting('morningBriefTime', e.target.value)}
          />
        </SettingRow>
        <SettingRow label="Evening Review">
          <input
            type="time"
            className="settings-input"
            value={eveningReviewTime}
            onChange={(e) => setSetting('eveningReviewTime', e.target.value)}
          />
        </SettingRow>
      </GlassCard>

      {/* Automation */}
      <GlassCard className="p-0 divide-y divide-[#E5E5EA]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Automation
          </p>
        </div>
        <SettingRow label="Auto-set Alarms">
          <Toggle
            value={autoAlarm}
            onChange={(v) => setSetting('autoAlarm', v)}
          />
        </SettingRow>
        <SettingRow label="Auto-sync to CRM">
          <Toggle
            value={autoCRMSync}
            onChange={(v) => setSetting('autoCRMSync', v)}
          />
        </SettingRow>
        <SettingRow label="Voice Input">
          <Toggle
            value={voiceInput}
            onChange={(v) => setSetting('voiceInput', v)}
          />
        </SettingRow>
      </GlassCard>

      {/* Health & Budget */}
      <GlassCard className="p-0 divide-y divide-[#E5E5EA]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
            Health & Budget
          </p>
        </div>
        <SettingRow label="Calorie Goal">
          <input
            type="number"
            inputMode="numeric"
            className="settings-input"
            value={calorieGoal}
            onChange={(e) => setSetting('calorieGoal', Number(e.target.value))}
          />
        </SettingRow>
        <SettingRow label="Weekly Budget Cap">
          <input
            type="number"
            inputMode="numeric"
            className="settings-input"
            value={weeklyBudgetCap}
            onChange={(e) => setSetting('weeklyBudgetCap', Number(e.target.value))}
          />
        </SettingRow>
      </GlassCard>

      {/* DFG CRM */}
      <GlassCard className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">
          DFG CRM Connection
        </p>
        <p className="text-xs text-[#6E6E73] mb-4">
          Connected to Supabase · cmntmktwcrkqryuaocui
        </p>
        <button
          onClick={testCRM}
          disabled={crmStatus === 'loading'}
          className="w-full py-3 rounded-xl border border-[#E5E5EA] text-sm font-semibold
                     text-[#1D1D1F] active:scale-95 transition-transform flex items-center
                     justify-center gap-2 disabled:opacity-60"
        >
          {crmStatus === 'loading' && (
            <Loader2 size={16} className="animate-spin text-[#6E6E73]" />
          )}
          {crmStatus === 'ok' && (
            <CheckCircle size={16} className="text-[#00d084]" />
          )}
          {crmStatus === 'error' && (
            <XCircle size={16} className="text-[#ff4d6a]" />
          )}
          {crmStatus === 'idle' && 'Test DFG CRM Connection'}
          {crmStatus === 'loading' && 'Testing...'}
          {crmStatus === 'ok' && 'Connected ✓'}
          {crmStatus === 'error' && 'Connection failed'}
        </button>
      </GlassCard>

      {/* Calendar Sync */}
      <GlassCard className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-2">
          Calendar Sync
        </p>
        <p className="text-xs text-[#6E6E73] mb-3">
          Subscribe to your CRM meetings in Apple Calendar or Google Calendar. Paste this URL once — events auto-update.
        </p>
        <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-xl p-3 mb-3">
          <p className="flex-1 text-[10px] font-mono text-[#1D1D1F] truncate">{feedUrl}</p>
          <button type="button" onClick={copyFeedUrl} className="text-[#1560FF] flex-shrink-0 active:scale-90 transition-transform">
            {copied ? <Check size={14} className="text-[#00d084]" /> : <Copy size={14} />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-[10px] text-[#6E6E73]">
            <p className="font-semibold text-[#1D1D1F] mb-1">📱 iPhone Apple Calendar</p>
            Settings → Calendar → Accounts → Other → Add Subscribed Calendar
          </div>
          <div className="text-[10px] text-[#6E6E73]">
            <p className="font-semibold text-[#1D1D1F] mb-1">💻 Google Calendar</p>
            calendar.google.com → Other Calendars (+) → From URL
          </div>
        </div>
      </GlassCard>

      {/* App info */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-mono text-[#6E6E73]">FlowOS · Phase 1</p>
        <p className="text-[10px] text-[#6E6E73]/50 mt-0.5">Digital Flow Global</p>
      </div>
    </div>
  )
}

// --- Sub-components ---

function SettingRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-[#1D1D1F]">{label}</p>
      {children}
    </div>
  )
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0
        ${value ? 'bg-[#1560FF]' : 'bg-[#E5E5EA]'}`}
      aria-label={value ? 'Enabled' : 'Disabled'}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}
