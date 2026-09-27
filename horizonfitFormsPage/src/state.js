/**
 * Horizon Fit Assessment State Management
 */

export const INITIAL_STATE = {
  currentStep: 0, // 0: Landing, 1: Basics, 2: Health profile, 3: Review, 4: Processing, 5: Success
  returnToReview: false,
  formData: {
    fullName: '',
    mobile: '',
    email: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    waist: '',
    familyDiabetes: 'No',
    highBloodSugar: 'No',
    highBP: 'No',
    physicalActivity: 'Some activity during the week',
    conditions: ['None of the Above'],
    primaryGoal: 'Reduce Waist Size',
    contactPreference: 'Yes',
    assessmentDate: getTodayFormatted(),
    confirmedAccurate: false,
    generatedPdfBlob: null,
    generatedPdfUrl: null,
    generatedPdfFilename: ''
  },
  errors: {}
};

export const SAMPLE_PROFILE = {
  fullName: 'Ananya Raman',
  mobile: '9848022338',
  email: 'ananya.raman@example.com',
  age: '38',
  gender: 'Female',
  height: '160',
  weight: '72',
  waist: '88',
  familyDiabetes: 'Yes',
  highBloodSugar: 'No',
  highBP: 'No',
  physicalActivity: 'Mostly sitting / minimal weekly movement',
  conditions: ['None of the Above'],
  primaryGoal: 'Lose Weight',
  contactPreference: 'Yes',
  assessmentDate: '24 September 2026',
  confirmedAccurate: true
};

export function getTodayFormatted() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function validateStep(step, data) {
  const errors = {};
  if (step === 3 && !data.confirmedAccurate) {
    errors.confirmedAccurate = 'Please confirm that your provided information is accurate before submitting.';
  }
  const stepsToValidate = step === 2 ? [2, 3, 4, 5] : (step === 3 ? [] : [step]);

  for (const validationStep of stepsToValidate) {
    if (validationStep === 1) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        errors.fullName = 'Please enter your full legal name.';
      }
      const cleanMobile = (data.mobile || '').replace(/\D/g, '');
      if (!cleanMobile || cleanMobile.length < 10) {
        errors.mobile = 'Please enter a valid 10-digit mobile number.';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }
      const ageNum = parseInt(data.age, 10);
      if (!data.age || isNaN(ageNum) || ageNum < 15 || ageNum > 110) {
        errors.age = 'Please enter an age between 15 and 110.';
      }
      if (!data.gender) {
        errors.gender = 'Please select your gender.';
      }
    } else if (validationStep === 2) {
      const h = parseFloat(data.height);
      if (!data.height || isNaN(h) || h < 100 || h > 240) {
        errors.height = 'Please enter height in cm (100 - 240 cm).';
      }
      const w = parseFloat(data.weight);
      if (!data.weight || isNaN(w) || w < 30 || w > 300) {
        errors.weight = 'Please enter weight in kg (30 - 300 kg).';
      }
      const waist = parseFloat(data.waist);
      if (!data.waist || isNaN(waist) || waist < 45 || waist > 200) {
        errors.waist = 'Please enter waist circumference in cm (45 - 200 cm).';
      }
    } else if (validationStep === 3) {
      if (!data.familyDiabetes) errors.familyDiabetes = 'Please select Yes or No.';
      if (!data.highBloodSugar) errors.highBloodSugar = 'Please select Yes or No.';
      if (!data.highBP) errors.highBP = 'Please select Yes or No.';
    } else if (validationStep === 4) {
      if (!data.physicalActivity) {
        errors.physicalActivity = 'Please choose your current physical activity level.';
      }
      if (!data.conditions || data.conditions.length === 0) {
        errors.conditions = 'Please select applicable conditions or None of the Above.';
      }
    } else if (validationStep === 5) {
      if (!data.primaryGoal) {
        errors.primaryGoal = 'Please choose what you would most like to improve.';
      }
      if (!data.contactPreference) {
        errors.contactPreference = 'Please select whether you would like a team member to contact you.';
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
