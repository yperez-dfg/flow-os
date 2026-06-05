import CRMTaskList from '@/components/planner/CRMTaskList'
import PersonalTaskList from '@/components/planner/PersonalTaskList'
import WeeklyGoals from '@/components/planner/WeeklyGoals'
import LongTermGoals from '@/components/planner/LongTermGoals'
import SchedulePlanner from '@/components/planner/SchedulePlanner'

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display italic text-2xl font-normal text-[#1D1D1F]">Planner</h1>
        <SchedulePlanner />
      </div>

      <CRMTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <PersonalTaskList />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <WeeklyGoals />
      <div className="w-full h-px bg-[#E5E5EA]" />

      <LongTermGoals />
    </div>
  )
}
