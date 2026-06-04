import SettingsForm from '@/components/settings/SettingsForm'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4">
      <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F] mb-6">Settings</h1>
      <SettingsForm />
    </div>
  )
}
