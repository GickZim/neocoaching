export type WorkoutPlan = {
  id: string;
  title: string;
  description: string;
  goal: string | null;
  duration_weeks: number | null;
  pdf_url: string | null;
  archived: boolean;
  created_at: string;
};

export type WorkoutDay = {
  id: string;
  plan_id: string;
  name: string;
  day_order: number;
};

export type WorkoutExercise = {
  id: string;
  day_id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  video_url: string | null;
  exercise_order: number;
};

export type WorkoutDayWithExercises = WorkoutDay & {
  workout_exercises: WorkoutExercise[];
};

export type WorkoutPlanFull = WorkoutPlan & {
  workout_days: WorkoutDayWithExercises[];
};

export type SetLog = {
  set_number: number;
  weight_kg: number | null;
  reps_completed: number | null;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  plan_id: string;
  day_id: string;
  exercise_id: string;
  logged_date: string;
  sets_data: SetLog[];
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  plan_id: string;
  day_id: string;
  logged_date: string;
  completed: boolean;
  notes: string | null;
  difficulty: number | null;
  energy: number | null;
  created_at: string;
};

export type ExercisePR = {
  id: string;
  user_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  achieved_date: string;
};
