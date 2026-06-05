import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import WeeklyGoals from '@/components/planner/WeeklyGoals'
import SchedulePlanner from '@/components/planner/SchedulePlanner'

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Planner</h1>
        <SchedulePlanner />
      </div>
      <CRMTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />
      <PersonalTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8a8f9a] mb-3">
          Weekly Goals
        </p>
        <WeeklyGoals />
      </div>
    </div>
  )
}
