import CRMStatsGrid from '@/components/home/CRMStatsGrid'
import DailyOverviewCard from '@/components/home/DailyOverviewCard'
import StreakTracker from '@/components/home/StreakTracker'

export default function HomePage() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="font-display text-2xl font-bold">FlowOS</h1>
        <p className="text-[#8a8f9a] text-sm font-mono">DFG Command</p>
      </div>
      <DailyOverviewCard />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
          DFG CRM · Live
        </p>
        <CRMStatsGrid />
      </div>
      <StreakTracker streak={0} />
    </div>
  )
}
