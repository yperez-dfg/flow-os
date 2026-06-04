import WeightChart from '@/components/fitness/WeightChart'
import WorkoutSchedule from '@/components/fitness/WorkoutSchedule'
import CalorieRing from '@/components/fitness/CalorieRing'

export default function FitnessPage() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="font-display text-2xl font-bold">Fitness</h1>
      <WeightChart />
      <CalorieRing />
      <WorkoutSchedule />
    </div>
  )
}
