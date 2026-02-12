/**
 * Calculate health recommendations based on body metrics
 * Backend version of the calculation logic
 */

function calculateRecommendations(metrics) {
  const { weight, bodyFatPercentage, visceralFat } = metrics;
  
  // Calculate lean body mass
  const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
  
  // BMR using Katch-McArdle formula (based on lean body mass)
  const bmr = 370 + (21.6 * leanBodyMass);
  
  // Activity multiplier (moderate activity assumed for wellness)
  const activityMultiplier = 1.55;
  
  // TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultiplier;
  
  // Calorie recommendation
  let dailyCalories;
  if (bodyFatPercentage > 25) {
    dailyCalories = Math.round(tdee - 300); // Mild deficit
  } else if (bodyFatPercentage < 15) {
    dailyCalories = Math.round(tdee + 200); // Slight surplus
  } else {
    dailyCalories = Math.round(tdee); // Maintenance
  }
  
  // Water intake: 30-40ml per kg body weight
  const waterIntake = Math.round((weight * 0.035) * 10) / 10;
  
  // Sleep duration based on overall health markers
  let sleepDuration;
  if (visceralFat > 12 || bodyFatPercentage > 30) {
    sleepDuration = 8;
  } else {
    sleepDuration = 7.5;
  }
  
  // Sleep schedule (assuming 7 AM wake time)
  const sleepWakeTime = '07:00';
  const bedTimeHour = 7 - sleepDuration;
  const sleepBedTime = bedTimeHour >= 0 
    ? `${String(Math.floor(23 + bedTimeHour)).padStart(2, '0')}:00`
    : `${String(Math.floor(24 + 23 + bedTimeHour) % 24).padStart(2, '0')}:00`;
  
  // Exercise recommendations
  let exerciseMinutes;
  let exerciseType;
  
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
  let meditationMinutes;
  if (visceralFat > 12) {
    meditationMinutes = 15;
  } else {
    meditationMinutes = 10;
  }
  
  // Mindset tip
  const mindsetTips = [
    'Focus on progress, not perfection. Small daily improvements lead to lasting change.',
    'Celebrate every healthy choice you make. You\'re building a new lifestyle.',
    'Remember: consistency beats intensity. Show up every day, even for 10 minutes.',
    'Your body is adapting. Trust the process and be patient with yourself.',
    'Visualize your healthiest self. The mind leads, the body follows.',
  ];
  
  const tipIndex = Math.floor((weight + bodyFatPercentage + visceralFat) % mindsetTips.length);
  
  return {
    dailyCalories,
    waterIntake,
    sleepDuration,
    sleepBedTime,
    sleepWakeTime,
    exerciseMinutes,
    exerciseType,
    meditationMinutes,
    mindsetTip: mindsetTips[tipIndex]
  };
}

export default calculateRecommendations;