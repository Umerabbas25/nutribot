/**
 * TDEE / BMR Calculation Utilities
 * Uses the Mifflin-St Jeor equation (most accurate for general population)
 *
 * BMR (men)   = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
 * BMR (women) = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
 *
 * TDEE = BMR × activity multiplier
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'       // Little or no exercise
  | 'lightly_active'  // Light exercise 1–3 days/week
  | 'moderately_active' // Moderate exercise 3–5 days/week
  | 'very_active'     // Hard exercise 6–7 days/week
  | 'extra_active';   // Very hard exercise + physical job

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export interface TDEEResult {
  bmr: number;
  tdee: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  // For 'other' gender, we use the average of male and female
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base - 78); // average
}

/**
 * Calculate TDEE and macro targets
 * Protein: 0.8g per lb of bodyweight (standard recommendation)
 * Fat: 25% of total calories
 * Carbs: remainder
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
): TDEEResult {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // Macro targets
  const weightLbs = weightKg * 2.205;
  const proteinGrams = Math.round(weightLbs * 0.8);
  const fatGrams = Math.round((tdee * 0.25) / 9);
  const carbsGrams = Math.round((tdee - proteinGrams * 4 - fatGrams * 9) / 4);

  return { bmr, tdee, proteinGrams, carbsGrams, fatGrams };
}

/**
 * Format a macro summary string for WhatsApp messages
 */
export function formatMacroSummary(result: TDEEResult): string {
  return (
    `🎯 *Your Daily Targets*\n` +
    `• Calories: ${result.tdee} kcal\n` +
    `• Protein: ${result.proteinGrams}g\n` +
    `• Carbs: ${result.carbsGrams}g\n` +
    `• Fat: ${result.fatGrams}g`
  );
}
