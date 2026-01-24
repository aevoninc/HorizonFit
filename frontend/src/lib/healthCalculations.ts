// Health recommendation calculations based on body metrics
// These formulas are simplified for the frontend demo

import { BodyMetrics, HealthRecommendations } from './normalPlanTypes';

export function calculateRecommendations(metrics: BodyMetrics): HealthRecommendations {
  const { weight, bodyFatPercentage, visceralFat } = metrics;
  
  // Calculate lean body mass
  const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
  
  // BMR using Katch-McArdle formula (based on lean body mass)
  const bmr = 370 + (21.6 * leanBodyMass);
  
  // Activity multiplier (moderate activity assumed for wellness)
  const activityMultiplier = 1.55;
  
  // TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultiplier;
  
  // Calorie recommendation (slight deficit for fat loss, maintenance for healthy BF%)
  let calorieGoal: number;
  if (bodyFatPercentage > 25) {
    calorieGoal = Math.round(tdee - 300); // Mild deficit
  } else if (bodyFatPercentage < 15) {
    calorieGoal = Math.round(tdee + 200); // Slight surplus
  } else {
    calorieGoal = Math.round(tdee); // Maintenance
  }
  
  // Water intake: 30-40ml per kg body weight
  const waterIntake = Math.round((weight * 0.035) * 10) / 10;
  
  // Sleep duration based on overall health markers
  let sleepDuration: number;
  if (visceralFat > 12 || bodyFatPercentage > 30) {
    sleepDuration = 8; // More recovery needed
  } else {
    sleepDuration = 7.5;
  }
  
  // Sleep schedule (assuming 7 AM wake time)
  const wakeTime = '07:00';
  const bedTimeHour = 7 - sleepDuration;
  const bedTime = bedTimeHour >= 0 
    ? `${String(Math.floor(23 + bedTimeHour)).padStart(2, '0')}:00`
    : `${String(Math.floor(24 + 23 + bedTimeHour) % 24).padStart(2, '0')}:00`;
  
  // Exercise recommendations based on visceral fat and body fat %
  let exerciseMinutes: number;
  let exerciseType: string;
  
  if (visceralFat > 15) {
    exerciseMinutes = 45;
    exerciseType = 'Low-intensity cardio (walking, swimming) + light resistance training';
  } else if (visceralFat > 10) {
    exerciseMinutes = 40;
    exerciseType = 'Moderate cardio + strength training (3 days/week)';
  } else if (bodyFatPercentage > 25) {
    exerciseMinutes = 35;
    exerciseType = 'HIIT (2x/week) + strength training (3x/week)';
  } else {
    exerciseMinutes = 30;
    exerciseType = 'Balanced mix of cardio and resistance training';
  }
  
  // Meditation recommendations
  let meditationMinutes: number;
  if (visceralFat > 12) {
    meditationMinutes = 15; // Stress management priority
  } else {
    meditationMinutes = 10;
  }
  
  // Mindset tip based on health status
  const mindsetTips = [
    'Focus on progress, not perfection. Small daily improvements lead to lasting change.',
    'Celebrate every healthy choice you make. You\'re building a new lifestyle.',
    'Remember: consistency beats intensity. Show up every day, even for 10 minutes.',
    'Your body is adapting. Trust the process and be patient with yourself.',
    'Visualize your healthiest self. The mind leads, the body follows.',
  ];
  
  const tipIndex = Math.floor((weight + bodyFatPercentage + visceralFat) % mindsetTips.length);
  
  return {
    dailyCalories: calorieGoal,
    waterIntake,
    sleepDuration,
    sleepSchedule: { bedTime, wakeTime },
    exerciseMinutes,
    exerciseType,
    meditationMinutes,
    mindsetTip: mindsetTips[tipIndex],
  };
}

// BMI calculation helper
export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

// Body fat category helper
export function getBodyFatCategory(bodyFatPercentage: number, isMale: boolean): string {
  if (isMale) {
    if (bodyFatPercentage < 6) return 'Essential';
    if (bodyFatPercentage < 14) return 'Athletic';
    if (bodyFatPercentage < 18) return 'Fit';
    if (bodyFatPercentage < 25) return 'Average';
    return 'Above Average';
  } else {
    if (bodyFatPercentage < 14) return 'Essential';
    if (bodyFatPercentage < 21) return 'Athletic';
    if (bodyFatPercentage < 25) return 'Fit';
    if (bodyFatPercentage < 32) return 'Average';
    return 'Above Average';
  }
}

// Visceral fat risk level
export function getVisceralFatRisk(visceralFat: number): { level: string; color: string } {
  if (visceralFat <= 9) {
    return { level: 'Healthy', color: 'text-green-600' };
  } else if (visceralFat <= 14) {
    return { level: 'Moderate', color: 'text-yellow-600' };
  } else {
    return { level: 'High Risk', color: 'text-red-600' };
  }
}
