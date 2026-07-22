export type MealPlan = {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  pdf_url: string | null;
  archived: boolean;
  created_at: string;
};

export type Meal = {
  id: string;
  plan_id: string;
  name: string;
  meal_order: number;
  time_suggestion: string | null;
};

export type MealFood = {
  id: string;
  meal_id: string;
  name: string;
  quantity: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  food_order: number;
};

export type MealWithFoods = Meal & {
  meal_foods: MealFood[];
};

export type MealPlanFull = MealPlan & {
  meals: MealWithFoods[];
};

export type MealLog = {
  id: string;
  user_id: string;
  plan_id: string;
  meal_id: string;
  logged_date: string;
  completed: boolean;
  created_at: string;
};

export type NutritionMetric = {
  id: string;
  user_id: string;
  logged_date: string;
  calories_consumed: number | null;
  protein_consumed: number | null;
  carbs_consumed: number | null;
  fats_consumed: number | null;
  compliance_pct: number | null;
};