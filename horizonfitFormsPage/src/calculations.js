/**
 * Horizon Fit Metabolic Calculations and Clinical Interpretation Rules
 * Strictly follows Horizon Fit reference standards (Asian Indian guidelines).
 */

export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return { bmi: 0, category: 'Unknown', riskLevel: 'unknown' };
  }
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Number(rawBmi.toFixed(1));

  // Asian Indian BMI cut-offs
  let category = '';
  let riskLevel = 'normal';

  if (bmi < 18.5) {
    category = 'Underweight';
    riskLevel = 'attention';
  } else if (bmi < 23.0) {
    category = 'Desirable';
    riskLevel = 'normal';
  } else if (bmi <= 24.9) {
    category = 'Increased risk';
    riskLevel = 'warning';
  } else {
    category = 'Obesity range';
    riskLevel = 'elevated';
  }

  return { bmi, category, riskLevel };
}

export function evaluateWaist(waistCm, gender = 'Male') {
  if (!waistCm || waistCm <= 0) {
    return { status: 'Unknown', isElevated: false, threshold: 90 };
  }

  let threshold = 90; // Default Male
  if (gender === 'Female') {
    threshold = 80;
  } else if (gender === 'Transgender') {
    threshold = 85;
  }

  const isElevated = waistCm >= threshold;
  const status = isElevated ? 'Above reference range' : 'Desirable';
  return { status, isElevated, threshold };
}

export function generateInterpretations(data) {
  const { bmi, category: bmiCategory, riskLevel: bmiRisk } = calculateBMI(data.height, data.weight);
  const { status: waistStatus, isElevated: waistElevated } = evaluateWaist(data.waist, data.gender);

  // 01 Body Composition
  let bodyCompText = '';
  if (bmi >= 25 && waistElevated) {
    bodyCompText = `BMI of ${bmi} kg/m² and waist circumference of ${data.waist} cm are both above the reference range used in the supplied assessment.`;
  } else if (bmi >= 23 && waistElevated) {
    bodyCompText = `BMI of ${bmi} kg/m² indicates increased risk and waist circumference of ${data.waist} cm is above the reference threshold for ${data.gender.toLowerCase()}s.`;
  } else if (waistElevated) {
    bodyCompText = `BMI of ${bmi} kg/m² is within the desirable range, but waist circumference of ${data.waist} cm is above the reference threshold, suggesting central adiposity.`;
  } else if (bmi >= 25) {
    bodyCompText = `BMI of ${bmi} kg/m² falls in the obesity range, while waist circumference of ${data.waist} cm remains within reference limits.`;
  } else if (bmi >= 23) {
    bodyCompText = `BMI of ${bmi} kg/m² reflects increased metabolic risk, with waist circumference of ${data.waist} cm within desirable boundaries.`;
  } else {
    bodyCompText = `BMI of ${bmi} kg/m² and waist circumference of ${data.waist} cm are both within the desirable reference ranges used in the assessment.`;
  }

  // 02 Physical Activity
  let activityText = '';
  const activity = data.physicalActivity || '';
  if (activity.toLowerCase().includes('mostly sitting')) {
    activityText = 'The assessment records mostly sedentary activity with minimal weekly movement. The source report identifies initiating regular, structured physical activity as a core focus.';
  } else if (activity.toLowerCase().includes('some activity')) {
    activityText = 'The assessment records some activity during the week. The source report identifies strengthening regular physical activity as a focus.';
  } else if (activity.toLowerCase().includes('regularly active')) {
    activityText = 'The assessment records a regularly active lifestyle. The report emphasizes sustaining consistent cardiovascular and metabolic conditioning.';
  } else {
    activityText = 'The assessment records baseline physical activity that provides an anchor for progressive metabolic health improvements.';
  }

  // 03 Health Goal
  const goalStr = data.primaryGoal ? data.primaryGoal.toLowerCase() : 'improve overall health';
  const goalText = `The client's primary stated health goal is ${goalStr}.`;

  // 04 Health History
  const conditions = data.conditions || [];
  const hasHistoryOfDiabetes = data.familyDiabetes === 'Yes';
  const hasBloodSugar = data.highBloodSugar === 'Yes';
  const hasBP = data.highBP === 'Yes';
  const hasConditions = conditions.length > 0 && !conditions.includes('None of the Above');

  let historyText = '';
  if (!hasHistoryOfDiabetes && !hasBloodSugar && !hasBP && !hasConditions) {
    historyText = 'No family history of diabetes, previous high blood sugar, previous high blood pressure, or known health conditions were reported.';
  } else {
    const notedItems = [];
    if (hasHistoryOfDiabetes) notedItems.push('family history of diabetes');
    if (hasBloodSugar) notedItems.push('previous high blood sugar / prediabetes');
    if (hasBP) notedItems.push('previous high blood pressure');
    if (hasConditions) notedItems.push(`known conditions (${conditions.join(', ')})`);

    const itemsStr = notedItems.join(', ');
    historyText = `Reported health indicators include: ${itemsStr}. These factors highlight specific opportunities for physician-guided metabolic care.`;
  }

  // ASSESSMENT SUMMARY (Impression)
  let impressionSummary = '';
  if (bmi >= 25 && waistElevated) {
    impressionSummary = `The assessment indicates elevated BMI (${bmi} kg/m²) and significantly elevated waist circumference (${data.waist} cm), both above the reference ranges used in the report, suggesting increased metabolic and cardiometabolic risk.`;
  } else if (waistElevated || bmi >= 25) {
    const primaryFactor = waistElevated ? `waist circumference of ${data.waist} cm` : `BMI of ${bmi} kg/m²`;
    impressionSummary = `The assessment reveals elevated ${primaryFactor} above reference thresholds used in the report, suggesting targeted lifestyle and metabolic interventions would support long-term risk reduction.`;
  } else if (bmi >= 23 || hasBloodSugar || hasBP || hasHistoryOfDiabetes) {
    impressionSummary = `The assessment indicates borderline metabolic indicators (BMI ${bmi} kg/m², waist ${data.waist} cm) with relevant health history markers, presenting an optimal window for preventative cardiometabolic support.`;
  } else {
    impressionSummary = `The assessment indicates favorable baseline measurements (BMI ${bmi} kg/m², waist ${data.waist} cm) within desirable reference limits. Proactive metabolic maintenance and nutritional alignment are recommended.`;
  }

  return {
    bmi,
    bmiCategory,
    bmiRisk,
    waistStatus,
    waistElevated,
    bodyCompText,
    activityText,
    goalText,
    historyText,
    impressionSummary
  };
}

export function getMeasurementResultDetails(data) {
  const { bmi } = calculateBMI(data.height, data.weight);
  const { isElevated: waistElevated } = evaluateWaist(data.waist, data.gender);
  const resultDetails = [];

  if (bmi >= 23.0 && waistElevated) {
    resultDetails.push('When both BMI and waist circumference are above the recommended reference ranges, this may indicate excess body fat, particularly around the abdomen. This is associated with an increased risk of insulin resistance, type 2 diabetes, abnormal cholesterol, high blood pressure and fatty liver disease. Further assessment may help identify whether any metabolic abnormalities are present.');
  } else if (bmi >= 23.0) {
    resultDetails.push('An above-range BMI may indicate excess body fat and may be associated with an increased risk of insulin resistance, type 2 diabetes, abnormal cholesterol, high blood pressure and fatty liver disease. Further assessment may help identify whether any metabolic abnormalities are present.');
  } else if (waistElevated) {
    resultDetails.push('An increased waist circumference may indicate excess fat around the abdomen, which is associated with an increased risk of insulin resistance, type 2 diabetes, high blood pressure, abnormal cholesterol and fatty liver disease. Further assessment may help identify whether any metabolic abnormalities are present.');
  } else if (bmi > 0 && bmi < 18.5) {
    resultDetails.push('Your BMI is below the recommended reference range. Further assessment may help determine whether additional nutritional or health support would be appropriate.');
  }

  return resultDetails;
}

export function getHealthHistoryRiskDetails(data) {
  const hasMedicalHistoryRisk = (
    data.familyDiabetes === 'Yes' ||
    data.highBloodSugar === 'Yes' ||
    data.highBP === 'Yes'
  );

  return hasMedicalHistoryRisk
    ? ['Your responses indicate one or more relevant health risk factors, including family history of diabetes, a personal history of prediabetes, diabetes or high blood sugar, or a history of high blood pressure. These factors may increase your risk of future metabolic and cardiovascular complications. Further assessment is recommended to evaluate your metabolic health.']
    : [];
}

export function getLifestyleRiskDetails(data) {
  const activity = (data.physicalActivity || '').toLowerCase();
  const riskFactors = [];

  if (activity.includes('mostly sitting') || activity.includes('minimal') || activity.includes('sedentary')) {
    riskFactors.push('a mostly sedentary activity level');
  } else if (activity.includes('some activity') || activity.includes('moderate')) {
    riskFactors.push('some activity during the week');
  }

  const conditions = (data.conditions || []).filter(condition => condition !== 'None of the Above');
  if (conditions.length > 0) {
    riskFactors.push(`reported health conditions (${conditions.join(', ')})`);
  }

  return riskFactors.length > 0
    ? [`Your responses include ${riskFactors.join(' and ')}, which are counted as risk factors in this screening.`]
    : [];
}

export function getScreeningDetails(data) {
  const { bmi } = calculateBMI(data.height, data.weight);
  const { isElevated: waistElevated } = evaluateWaist(data.waist, data.gender);

  // BMI Finding
  let bmiFinding = 'Within the Asian Indian healthy range';
  if (bmi >= 23.0) {
    bmiFinding = 'Above the Asian Indian healthy range';
  } else if (bmi > 0 && bmi < 18.5) {
    bmiFinding = 'Below the Asian Indian healthy range';
  }

  // Waist Reference & Finding
  let waistRef = '<90 cm (Male)';
  if (data.gender === 'Female') {
    waistRef = '<80 cm (Female)';
  } else if (data.gender === 'Transgender') {
    waistRef = '<85 cm';
  }
  const waistFinding = waistElevated ? 'Increased waist circumference' : 'Desirable waist circumference';

  // Section 03 - Screening Findings
  const diabetesHistory = data.highBloodSugar === 'Yes'
    ? 'Previous history of prediabetes, diabetes, or high blood sugar reported.'
    : 'No previous history of prediabetes, diabetes, or high blood sugar reported.';

  const familyHistory = data.familyDiabetes === 'Yes'
    ? 'Family history of diabetes identified.'
    : 'No family history of diabetes reported.';

  const bloodPressureHistory = data.highBP === 'Yes'
    ? 'History of high blood pressure reported.'
    : 'No history of high blood pressure reported.';

  const activity = (data.physicalActivity || '').toLowerCase();
  const isLowActivity = activity.includes('mostly sitting') || activity.includes('minimal') || activity.includes('sedentary');
  const isModerateActivity = activity.includes('some activity') || activity.includes('moderate');
  const activityIsRiskFactor = isLowActivity || isModerateActivity;

  let physicalActivity = 'Regular physical activity identified.';
  if (isLowActivity) {
    physicalActivity = 'Low physical activity identified.';
  } else if (isModerateActivity) {
    physicalActivity = 'Moderate physical activity identified.';
  }

  const conditions = data.conditions || [];
  const hasConditions = conditions.length > 0 && !conditions.includes('None of the Above');
  const healthHistory = hasConditions
    ? `Reported condition(s): ${conditions.join(', ')}.`
    : 'No additional selected health conditions reported.';

  // Section 04 - Screening Result
  const hasMedicalHistoryRisk = (
    data.familyDiabetes === 'Yes' ||
    data.highBloodSugar === 'Yes' ||
    data.highBP === 'Yes'
  );

  const hasMeasurementRisk = (bmi >= 23.0 || (bmi > 0 && bmi < 18.5) || waistElevated);
  const hasRiskFactors = (
    hasMeasurementRisk ||
    hasMedicalHistoryRisk ||
    activityIsRiskFactor ||
    hasConditions
  );

  const screeningResult = hasRiskFactors
    ? 'METABOLIC RISK FACTORS IDENTIFIED'
    : 'NO SIGNIFICANT RISK FACTORS IDENTIFIED';

  const resultDetails = [
    ...getMeasurementResultDetails(data),
    ...getHealthHistoryRiskDetails(data),
    ...getLifestyleRiskDetails(data)
  ];

  if (!hasRiskFactors) {
    resultDetails.push('No significant metabolic risk factors were identified from the responses and body measurements provided in this basic screening. However, this screening does not rule out underlying metabolic abnormalities. Maintaining healthy lifestyle habits can help support your long-term metabolic health.');
  }

  // Section 05 - Key Factors Identified
  const keyFactors = [];
  if (bmi >= 23.0) {
    keyFactors.push('BMI above the Asian Indian healthy range');
  } else if (bmi > 0 && bmi < 18.5) {
    keyFactors.push('BMI below the Asian Indian healthy range');
  }

  if (waistElevated) {
    keyFactors.push('Increased waist circumference');
  }

  if (data.familyDiabetes === 'Yes') {
    keyFactors.push('Family history of diabetes');
  }

  if (data.highBloodSugar === 'Yes') {
    keyFactors.push('Previous history of prediabetes or diabetes');
  }

  if (data.highBP === 'Yes') {
    keyFactors.push('History of high blood pressure');
  }

  if (activityIsRiskFactor) {
    keyFactors.push('Low or moderate physical activity');
  }

  if (hasConditions) {
    keyFactors.push(`Reported health conditions (${conditions.join(', ')})`);
  }

  if (keyFactors.length === 0) {
    keyFactors.push('All recorded parameters currently within reference ranges');
  }

  const primaryGoal = data.primaryGoal || 'Lose Weight';

  const recommendedNextStep = hasRiskFactors
    ? 'Further assessment is recommended. Consider the Horizon Fit Metabolic Panel (HFMP), followed by the Horizon Fit Detailed Metabolic Health Assessment with doctor consultation and personalised recommendations.'
    : 'No immediate further assessment is indicated based on this screening alone. If you wish to assess your metabolic health in greater detail, you may opt for the HFMP and a doctor consultation through Horizon Fit.';

  const importantNote =
    'This is a preliminary screening, not a medical diagnosis, and it does not rule out underlying health conditions. Further assessment may be recommended if risk factors are identified.';

  return {
    bmi,
    bmiFinding,
    bmiReference: '18.5–22.9 kg/m²',
    waistRef,
    waistFinding,
    diabetesHistory,
    familyHistory,
    bloodPressureHistory,
    physicalActivity,
    healthHistory,
    hasRiskFactors,
    screeningResult,
    resultDetails,
    keyFactors,
    primaryGoal,
    recommendedNextStep,
    importantNote
  };
}
