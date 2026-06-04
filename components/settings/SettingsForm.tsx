'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings'
import { sb } from '@/lib/supabase'
import GlassCard from '@/components/ui/GlassCard'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

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
      <GlassCard className="p-0 divide-y divide-white/[0.06]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">
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
      <GlassCard className="p-0 divide-y divide-white/[0.06]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">
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
      <GlassCard className="p-0 divide-y divide-white/[0.06]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a]">
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
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
          DFG CRM Connection
        </p>
        <p className="text-xs text-[#8a8f9a] mb-4">
          Connected to Supabase · cmntmktwcrkqryuaocui
        </p>
        <button
          onClick={testCRM}
          disabled={crmStatus === 'loading'}
          className="w-full py-3 rounded-xl border border-white/[0.08] text-sm font-semibold
                     text-[#edeef2] active:scale-95 transition-transform flex items-center
                     justify-center gap-2 disabled:opacity-60"
        >
          {crmStatus === 'loading' && (
            <Loader2 size={16} className="animate-spin text-[#8a8f9a]" />
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

      {/* App info */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-mono text-[#8a8f9a]">FlowOS · Phase 1</p>
        <p className="text-[10px] text-[#8a8f9a]/50 mt-0.5">Digital Flow Global</p>
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
      <p className="text-sm text-[#edeef2]">{label}</p>
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
        ${value ? 'bg-[#1560FF]' : 'bg-white/[0.12]'}`}
      aria-label={value ? 'Enabled' : 'Disabled'}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}
