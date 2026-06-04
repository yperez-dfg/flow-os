const BASE = 'https://api.nal.usda.gov/fdc/v1'
const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY ?? 'DEMO_KEY'

export interface FoodResult {
  fdcId: number
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

function getNutrient(
  nutrients: { nutrientId: number; value: number }[],
  id: number
): number {
  return Math.round(nutrients.find(n => n.nutrientId === id)?.value ?? 0)
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  const url = `${BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${API_KEY}&pageSize=5&dataType=Survey%20(FNDDS),SR%20Legacy`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()

  return (data.foods ?? []).slice(0, 5).map((f: {
    fdcId: number
    description: string
    foodNutrients: { nutrientId: number; value: number }[]
  }) => ({
    fdcId: f.fdcId,
    description: f.description,
    calories: getNutrient(f.foodNutrients, 1008),
    protein:  getNutrient(f.foodNutrients, 1003),
    carbs:    getNutrient(f.foodNutrients, 1005),
    fat:      getNutrient(f.foodNutrients, 1004),
  }))
}
