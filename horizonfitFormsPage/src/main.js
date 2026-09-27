/**
 * Horizon Fit Metabolic Health Assessment Controller
 * Standalone Frontend Application (assessment.horizonfit.in)
 */

import confetti from 'canvas-confetti';
import { INITIAL_STATE, SAMPLE_PROFILE, validateStep, getTodayFormatted } from './state.js';
import { calculateBMI, evaluateWaist, generateInterpretations, getScreeningDetails } from './calculations.js';
import { generateHealthInsightPdf, formatAssessmentDate } from './pdf-generator.js';
import { formatFilename, prepareEmailPayload } from './email-service.js';

// Application State
let state = JSON.parse(JSON.stringify(INITIAL_STATE));
let activeEmailPayload = null;
const reportTokenFromLink = new URLSearchParams(window.location.hash.slice(1)).get('token');
const savedReportToken = reportTokenFromLink || localStorage.getItem('horizonfit-report-token');
let reportPageLoading = false;
let reportPageError = '';

const appEl = document.getElementById('app');
const reportModalEl = document.getElementById('report-modal');
const reportModalContentEl = document.getElementById('report-modal-content');
const closeReportModalBtn = document.getElementById('close-report-modal');
const modalDownloadBtn = document.getElementById('modal-download-btn');

const emailModalEl = document.getElementById('email-modal');
const emailModalContentEl = document.getElementById('email-modal-content');
const closeEmailModalBtn = document.getElementById('close-email-modal');

// Close Modal Event Listeners
closeReportModalBtn?.addEventListener('click', () => {
  reportModalEl.style.display = 'none';
});
closeEmailModalBtn?.addEventListener('click', () => {
  emailModalEl.style.display = 'none';
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    reportModalEl.style.display = 'none';
    emailModalEl.style.display = 'none';
  }
});

modalDownloadBtn?.addEventListener('click', () => {
  triggerPdfDownload();
});

/**
 * Triggers browser download of the generated PDF
 */
function triggerPdfDownload() {
  if (!state.formData.generatedPdfBlob) {
    alert('Report is still generating, please wait a moment.');
    return;
  }
  const url = state.formData.generatedPdfUrl || URL.createObjectURL(state.formData.generatedPdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = state.formData.generatedPdfFilename || formatFilename(state.formData.fullName, state.formData.assessmentDate);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Main Render Router
 */
function render() {
  const step = state.currentStep;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  let html = `
    <!-- Top Global Header -->
    <header class="site-header">
      <div class="header-container">
        <a href="https://horizonfit.in" target="_blank" rel="noopener noreferrer" class="brand-link" aria-label="Visit HorizonFit.in">
          <img src="/horizonfit_logo.png" alt="Horizon Fit" class="brand-logo-img" />
          <span class="brand-subdomain-pill">Health assessment</span>
        </a>
        <div class="header-right">
          <a href="https://horizonfit.in" target="_blank" rel="noopener noreferrer" class="header-link">HorizonFit.in <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </header>
    <main class="assessment-main">
  `;

  if (reportPageLoading || reportPageError) {
    html += renderReportAccessPage();
  } else if (step === 0) {
    html += renderLandingPage();
  } else if (step >= 1 && step <= 5) {
    html += renderFormStep(step);
  } else if (step === 6) {
    html += renderReviewPage();
  } else if (step === 7) {
    html += renderProcessingState();
  } else if (step === 8) {
    html += renderSuccessPage();
  }

  html += `</main>`;
  appEl.innerHTML = html;

  attachEventListeners();
}

function renderReportAccessPage() {
  if (reportPageLoading) {
    return `
      <div class="assessment-card report-access-card" aria-live="polite">
        <div class="processing-spinner"></div>
        <h1 class="page-title">Loading your Health Insight Report</h1>
      </div>
    `;
  }

  if (reportPageError) {
    return `
      <div class="assessment-card report-access-card" role="alert">
        <div class="page-eyebrow">REPORT ACCESS</div>
        <h1 class="page-title">This report link is unavailable</h1>
        <p class="page-subtitle">${escapeHtml(reportPageError)}</p>
        <button class="btn btn-continue" id="retake-assessment-btn">Start a new assessment</button>
      </div>
    `;
  }

  return `
    <div class="assessment-card report-access-card" role="alert">
      <div class="page-eyebrow">REPORT ACCESS</div>
      <h1 class="page-title">Your saved report could not be loaded</h1>
      <p class="page-subtitle">${escapeHtml(reportPageError)}</p>
      <button class="btn btn-continue" id="retake-assessment-btn">Start a new assessment</button>
    </div>
  `;
}

function getApiBaseUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const defaultApiUrl = import.meta.env.PROD
    ? 'https://horizonfit.onrender.com/api/v1'
    : 'http://localhost:3000/api/v1';
  const shouldUseDefaultApi = !configuredApiUrl || (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(configuredApiUrl));
  return (shouldUseDefaultApi ? defaultApiUrl : configuredApiUrl).replace(/\/+$/, '');
}

async function loadReportPage() {
  const accessToken = reportTokenFromLink || localStorage.getItem('horizonfit-report-token');
  if (!accessToken) {
    reportPageError = 'Open the private report link sent to your email to view this report.';
    render();
    return;
  }

  localStorage.setItem('horizonfit-report-token', accessToken);
  if (reportTokenFromLink) history.replaceState(null, '', window.location.pathname);
  reportPageLoading = true;
  render();

  try {
    const response = await fetch(`${getApiBaseUrl()}/public/health-assessment/report`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const report = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(report.message || 'The report could not be loaded.');

    state.formData = { ...state.formData, ...report.formData };
    const filename = formatFilename(state.formData.fullName, state.formData.assessmentDate);
    const pdfBytes = await generateHealthInsightPdf(state.formData);
    state.formData.generatedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.formData.generatedPdfUrl = URL.createObjectURL(state.formData.generatedPdfBlob);
    state.formData.generatedPdfFilename = filename;
    state.currentStep = 8;
    reportPageError = '';
  } catch (error) {
    reportPageError = error.message || 'The report could not be loaded.';
    if (responseHasInvalidReportToken(error)) {
      localStorage.removeItem('horizonfit-report-token');
    }
  } finally {
    reportPageLoading = false;
    render();
  }
}

function responseHasInvalidReportToken(error) {
  return error.message.includes('could not be found') || error.message.includes('access link is required');
}

/**
 * Page 1: Assessment Landing Page
 */
function renderLandingPage() {
  return `
    <div class="assessment-card landing-card">
      <div class="landing-hero-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        BEGIN YOUR HORIZON FIT JOURNEY
      </div>

      <h1 class="landing-title">
        Better Health Begins<br>With Understanding.
      </h1>

      <div class="landing-subtitle-group">
        <p class="landing-lead">Understand where you are. Identify what matters.</p>
        <p class="landing-description">
          Begin with the pathway aligned with your goals and health priorities. Receive your Doctor-Led Horizon Fit Health Insight Report upon completion.
        </p>
      </div>

      <div class="landing-actions">
        <button class="btn-cta-primary" id="start-assessment-btn">
          Book Metabolic Health Assessment
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
        <button class="btn-cta-secondary" id="secondary-cta-btn">
          Explore Weight Loss System
        </button>
      </div>

      <div class="landing-trust-bar">
        <div class="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          15 questions
        </div>
        <div class="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Approximately 3 minutes
        </div>
        <div class="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Private &amp; secure
        </div>
      </div>
    </div>
  `;
}

/**
 * Five-part health assessment
 */
function renderFormStep(step) {
  const stepConfig = {
    1: { num: '01 / 05', pct: '20%', title: "Let's start with the basics.", subtitle: 'Tell us a little about yourself.' },
    2: { num: '02 / 05', pct: '40%', title: "Let's understand your current profile.", subtitle: 'These measurements help us understand your current health profile.' },
    3: { num: '03 / 05', pct: '60%', title: "Let's understand your health history.", subtitle: 'Personal and family health context helps calibrate screening accuracy.' },
    4: { num: '04 / 05', pct: '80%', title: 'Tell us about your lifestyle.', subtitle: 'Movement patterns and diagnosed metabolic conditions.' },
    5: { num: '05 / 05', pct: '100%', title: 'What would you most like to improve?', subtitle: 'Select your primary objective and communication preference.' }
  };
  const curr = stepConfig[step];

  return `
    <div class="assessment-card">
      <div class="progress-container">
        <div class="progress-meta">
          <span class="progress-step-counter">${curr.num}</span>
          <span class="progress-step-name">${getStepName(step)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" style="width: ${curr.pct};"></div>
        </div>
      </div>

      <div class="page-header-block">
        <h2 class="page-title">${curr.title}</h2>
        <p class="page-subtitle">${curr.subtitle}</p>
      </div>

      <form id="step-form" novalidate>
        ${renderStepContent(step)}

        <div class="assessment-nav-bar">
          <button type="button" class="btn btn-back" id="back-step-btn">
            ← Back
          </button>
          <button type="submit" class="btn btn-continue" id="continue-step-btn">
            ${state.returnToReview ? 'Return to Review →' : (step === 5 ? 'Review Assessment →' : 'Continue →')}
          </button>
        </div>
      </form>
    </div>
  `;
}

function getStepName(step) {
  switch (step) {
    case 1: return 'Personal Information';
    case 2: return 'Body Measurements';
    case 3: return 'Health History';
    case 4: return 'Lifestyle & Conditions';
    case 5: return 'Goals & Follow-up';
    default: return '';
  }
}

/**
 * Step Form Content Factory
 */
function renderStepContent(step) {
  const d = state.formData;
  const err = state.errors;

  if (step === 1) {
    return `
      <div class="form-fields-grid">
      <!-- Full Name -->
      <div class="form-group">
        <label class="form-label" for="field-fullName">
          Full Name <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="text" 
            id="field-fullName" 
            class="form-input ${err.fullName ? 'is-invalid' : ''}" 
            placeholder="Enter your full name" 
            value="${escapeHtml(d.fullName)}"
            required
          />
        </div>
        ${err.fullName ? `<div class="form-error-msg">⚠️ ${err.fullName}</div>` : ''}
      </div>

      <!-- Mobile Number (WhatsApp) -->
      <div class="form-group">
        <label class="form-label" for="field-mobile">
          Mobile Number (WhatsApp) <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <span class="input-prefix">+91</span>
          <input 
            type="tel" 
            id="field-mobile" 
            class="form-input has-prefix ${err.mobile ? 'is-invalid' : ''}" 
            placeholder="98765 43210" 
            value="${escapeHtml(d.mobile)}"
            maxlength="10"
            required
          />
        </div>
        ${err.mobile ? `<div class="form-error-msg">⚠️ ${err.mobile}</div>` : ''}
      </div>

      <!-- Email -->
      <div class="form-group">
        <label class="form-label" for="field-email">
          Email <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="email" 
            id="field-email" 
            class="form-input ${err.email ? 'is-invalid' : ''}" 
            placeholder="Enter your email address" 
            value="${escapeHtml(d.email)}"
            required
          />
        </div>
        ${err.email ? `<div class="form-error-msg">⚠️ ${err.email}</div>` : ''}
      </div>

      <!-- Age -->
      <div class="form-group">
        <label class="form-label" for="field-age">
          Age (Years) <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="number" 
            id="field-age" 
            class="form-input ${err.age ? 'is-invalid' : ''}" 
            placeholder="Enter age in years" 
            value="${escapeHtml(d.age)}"
            min="15" 
            max="110"
            required
          />
        </div>
        ${err.age ? `<div class="form-error-msg">⚠️ ${err.age}</div>` : ''}
      </div>

      <!-- Gender Option Cards -->
      <div class="form-group">
        <label class="form-label">
          Gender <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-3">
          ${['Male', 'Female', 'Transgender'].map(g => `
            <div class="option-card ${d.gender === g ? 'is-selected' : ''}" data-field="gender" data-val="${g}">
              <div class="option-card-label">${g}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
        ${err.gender ? `<div class="form-error-msg">⚠️ ${err.gender}</div>` : ''}
      </div>
      </div>
    `;
  }

  if (step === 2) {
    const { bmi, category, riskLevel } = calculateBMI(d.height, d.weight);
    const bmiBadgeClass = riskLevel === 'normal' ? 'bmi-desirable' : (riskLevel === 'warning' ? 'bmi-warning' : 'bmi-elevated');

    return `
      <section class="form-step-section">
        <div class="form-section-heading"><div><h3>Measurements</h3><p>Use your most recent measurements.</p></div></div>
        <div class="form-fields-grid form-fields-grid-three">
      <!-- Height -->
      <div class="form-group">
        <label class="form-label" for="field-height">
          Height (cm) <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="number" 
            id="field-height" 
            class="form-input has-suffix ${err.height ? 'is-invalid' : ''}" 
            placeholder="178" 
            value="${escapeHtml(d.height)}"
            min="100" 
            max="240"
            required
          />
          <span class="input-suffix">cm</span>
        </div>
        ${err.height ? `<div class="form-error-msg">⚠️ ${err.height}</div>` : ''}
      </div>

      <!-- Current Weight -->
      <div class="form-group">
        <label class="form-label" for="field-weight">
          Current Weight (kg) <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="number" 
            id="field-weight" 
            class="form-input has-suffix ${err.weight ? 'is-invalid' : ''}" 
            placeholder="99" 
            value="${escapeHtml(d.weight)}"
            min="30" 
            max="300"
            required
          />
          <span class="input-suffix">kg</span>
        </div>
        ${err.weight ? `<div class="form-error-msg">⚠️ ${err.weight}</div>` : ''}
      </div>

      <!-- Waist Circumference -->
      <div class="form-group">
        <label class="form-label" for="field-waist">
          Waist Circumference (cm) <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <input 
            type="number" 
            id="field-waist" 
            class="form-input has-suffix ${err.waist ? 'is-invalid' : ''}" 
            placeholder="118" 
            value="${escapeHtml(d.waist)}"
            min="45" 
            max="200"
            required
          />
          <span class="input-suffix">cm</span>
        </div>
        ${err.waist ? `<div class="form-error-msg">⚠️ ${err.waist}</div>` : ''}
      </div>
        </div>

      <!-- Dynamic Live BMI Box -->
      ${d.height && d.weight ? `
        <div class="live-bmi-calc-box">
          <div class="live-bmi-label">
            <span class="live-bmi-title">Calculated BMI</span>
            <span class="live-bmi-value">${bmi} <small style="font-size: 0.9rem; font-weight: normal; color: var(--secondary-text);">kg/m²</small></span>
          </div>
          <span class="live-bmi-tag ${bmiBadgeClass}">${category}</span>
        </div>
      ` : ''}

      <!-- Informational Panel -->
      <div class="info-notice-box">
        <div class="info-notice-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div class="info-notice-text">
          Your measurements are used to calculate BMI and understand waist-related health indicators. Do not present medical diagnosis.
        </div>
      </div>
      </section>

    `;
  }

  if (step === 3) {
    return `
      <!-- Family History of Diabetes -->
      <div class="form-group">
        <label class="form-label">
          Do you have a parent or sibling with diabetes? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-2">
          ${['Yes', 'No'].map(val => `
            <div class="option-card ${d.familyDiabetes === val ? 'is-selected' : ''}" data-field="familyDiabetes" data-val="${val}">
              <div class="option-card-label">${val}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Prediabetes / Diabetes / High Blood Sugar -->
      <div class="form-group">
        <label class="form-label">
          Have you ever been told you have prediabetes, diabetes, or high blood sugar? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-2">
          ${['Yes', 'No'].map(val => `
            <div class="option-card ${d.highBloodSugar === val ? 'is-selected' : ''}" data-field="highBloodSugar" data-val="${val}">
              <div class="option-card-label">${val}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- High Blood Pressure -->
      <div class="form-group">
        <label class="form-label">
          Have you ever been told you have high blood pressure? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-2">
          ${['Yes', 'No'].map(val => `
            <div class="option-card ${d.highBP === val ? 'is-selected' : ''}" data-field="highBP" data-val="${val}">
              <div class="option-card-label">${val}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (step === 4) {
    const activityTiers = [
      {
        title: 'Mostly sitting, very little activity',
        badge: 'Sedentary',
        badgeClass: 'badge-sedentary',
        desc: 'Desk-based routine with minimal planned physical exercise during the week.'
      },
      {
        title: 'Some activity during the week',
        badge: 'Moderate',
        badgeClass: 'badge-moderate',
        desc: 'Occasional light walks, recreational movement, or 1-2 moderate sessions.'
      },
      {
        title: 'Regularly active',
        badge: 'Active',
        badgeClass: 'badge-active',
        desc: 'Consistent workouts, brisk walking, or sports 3 or more times per week.'
      }
    ];

    const conditionOptions = [
      'Fatty Liver',
      'High Cholesterol',
      'PCOS',
      'Thyroid Disorder',
      'None of the Above'
    ];

    return `
      <!-- Physical Activity Level -->
      <div class="form-group">
        <label class="form-label">
          How would you describe your current physical activity level? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid">
          ${activityTiers.map(t => `
            <div class="option-card activity-card ${d.physicalActivity === t.title ? 'is-selected' : ''}" data-field="physicalActivity" data-val="${t.title}">
              <div class="activity-card-header">
                <span class="activity-badge ${t.badgeClass}">${t.badge}</span>
                <div class="option-indicator"></div>
              </div>
              <div class="option-card-label">${t.title}</div>
              <p style="font-size: 0.8rem; color: var(--secondary-text);">${t.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Known Health Conditions (Multi-select) -->
      <div class="form-group" style="margin-top: 2rem;">
        <label class="form-label">
          Have you ever been told you have any of the following? <span class="required-asterisk">*</span>
        </label>
        <p style="font-size: 0.85rem; color: var(--secondary-text); margin-bottom: 0.75rem;">
          Select all that apply. "None of the Above" clears other choices.
        </p>
        <div class="options-grid grid-cols-2">
          ${conditionOptions.map(c => {
      const isSelected = d.conditions.includes(c);
      return `
              <div class="option-card ${isSelected ? 'is-selected' : ''}" data-field="condition-multiselect" data-val="${c}">
                <div class="option-card-label">${c}</div>
                <div class="option-indicator checkbox"></div>
              </div>
            `;
    }).join('')}
        </div>
        ${err.conditions ? `<div class="form-error-msg">⚠️ ${err.conditions}</div>` : ''}
      </div>
    `;
  }

  if (step === 5) {
    const goals = [
      'Lose Weight',
      'Reduce Waist Size',
      'Control Blood Sugar',
      'Improve Energy Levels',
      'Improve Blood Pressure',
      'Improve Cholesterol',
      'Improve Overall Health'
    ];

    return `
      <!-- Primary Goal Grid -->
      <div class="form-group">
        <label class="form-label">
          What would you most like to improve right now? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-2">
          ${goals.map(g => `
            <div class="option-card ${d.primaryGoal === g ? 'is-selected' : ''}" data-field="primaryGoal" data-val="${g}">
              <div class="option-card-label">${g}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
        ${err.primaryGoal ? `<div class="form-error-msg">⚠️ ${err.primaryGoal}</div>` : ''}
      </div>

      <!-- Contact Preference -->
      <div class="form-group" style="margin-top: 2rem;">
        <label class="form-label">
          Would you like a Horizon Fit team member to contact you to discuss your responses? <span class="required-asterisk">*</span>
        </label>
        <div class="options-grid grid-cols-2">
          ${['Yes', 'No'].map(val => `
            <div class="option-card ${d.contactPreference === val ? 'is-selected' : ''}" data-field="contactPreference" data-val="${val}">
              <div class="option-card-label">${val}</div>
              <div class="option-indicator"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Step 6: Review Assessment Page
 */
function renderReviewPage() {
  const d = state.formData;
  const { bmi, category } = calculateBMI(d.height, d.weight);
  const conditionsStr = (d.conditions && d.conditions.length > 0 && !d.conditions.includes('None of the Above'))
    ? d.conditions.join(', ')
    : 'None of the Above';

  return `
    <div class="assessment-card">
      <div class="page-header-block">
        <div class="page-eyebrow">FINAL CONFIRMATION</div>
        <h2 class="page-title">Review Your Assessment</h2>
        <p class="page-subtitle">Please review your information before submitting.</p>
      </div>

      <div class="review-sections-list">
        ${state.errors.submission ? `<div class="form-error-msg" role="alert">${escapeHtml(state.errors.submission)}</div>` : ''}
        <!-- ABOUT YOU -->
        <div class="review-section-card">
          <div class="review-section-header">
            <span class="review-section-title">ABOUT YOU</span>
            <button type="button" class="btn-review-edit" data-jump-step="1">
              ✏️ Edit
            </button>
          </div>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-item-label">Full Name</span>
              <span class="review-item-val">${escapeHtml(d.fullName)}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Mobile (WhatsApp)</span>
              <span class="review-item-val">+91 ${escapeHtml(d.mobile)}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Email</span>
              <span class="review-item-val">${escapeHtml(d.email)}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Age</span>
              <span class="review-item-val">${escapeHtml(d.age)} years</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Gender</span>
              <span class="review-item-val">${escapeHtml(d.gender)}</span>
            </div>
          </div>
        </div>

        <!-- BODY MEASUREMENTS -->
        <div class="review-section-card">
          <div class="review-section-header">
            <span class="review-section-title">BODY MEASUREMENTS</span>
            <button type="button" class="btn-review-edit" data-jump-step="2">
              ✏️ Edit
            </button>
          </div>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-item-label">Height</span>
              <span class="review-item-val">${escapeHtml(d.height)} cm</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Current Weight</span>
              <span class="review-item-val">${escapeHtml(d.weight)} kg</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Waist Circumference</span>
              <span class="review-item-val">${escapeHtml(d.waist)} cm</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Calculated BMI</span>
              <span class="review-item-val">${bmi} kg/m² (${category})</span>
            </div>
          </div>
        </div>

        <!-- HEALTH HISTORY -->
        <div class="review-section-card">
          <div class="review-section-header">
            <span class="review-section-title">HEALTH HISTORY</span>
            <button type="button" class="btn-review-edit" data-jump-step="3">
              ✏️ Edit
            </button>
          </div>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-item-label">Family History of Diabetes</span>
              <span class="review-item-val">${d.familyDiabetes}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Prediabetes / Diabetes / High Sugar</span>
              <span class="review-item-val">${d.highBloodSugar}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">High Blood Pressure</span>
              <span class="review-item-val">${d.highBP}</span>
            </div>
          </div>
        </div>

        <!-- LIFESTYLE -->
        <div class="review-section-card">
          <div class="review-section-header">
            <span class="review-section-title">LIFESTYLE</span>
            <button type="button" class="btn-review-edit" data-jump-step="4">
              ✏️ Edit
            </button>
          </div>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-item-label">Physical Activity</span>
              <span class="review-item-val">${d.physicalActivity}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Health Conditions</span>
              <span class="review-item-val">${conditionsStr}</span>
            </div>
          </div>
        </div>

        <!-- HEALTH GOAL -->
        <div class="review-section-card">
          <div class="review-section-header">
            <span class="review-section-title">HEALTH GOAL</span>
            <button type="button" class="btn-review-edit" data-jump-step="5">
              ✏️ Edit
            </button>
          </div>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-item-label">Primary Goal</span>
              <span class="review-item-val">${d.primaryGoal}</span>
            </div>
            <div class="review-item">
              <span class="review-item-label">Contact Preference</span>
              <span class="review-item-val">${d.contactPreference === 'Yes' ? 'Yes, please contact me' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Notice -->
      <label class="review-consent-box">
        <input 
          type="checkbox" 
          id="confirm-accurate-check" 
          class="consent-checkbox" 
          ${d.confirmedAccurate ? 'checked' : ''} 
        />
        <span class="consent-label">
          By submitting this assessment, I confirm that the information provided is accurate and consent to receiving my Horizon Fit Health Insight Report.
        </span>
      </label>
      ${state.errors.confirmedAccurate ? `<div class="form-error-msg" style="margin-top: -1.25rem; margin-bottom: 1.5rem;">⚠️ ${state.errors.confirmedAccurate}</div>` : ''}

      <div class="assessment-nav-bar">
        <button type="button" class="btn btn-back" id="back-from-review-btn">
          ← Back
        </button>
        <button type="button" class="btn btn-submit" id="complete-assessment-btn">
          Complete Assessment &amp; Generate Report →
        </button>
      </div>
    </div>
  `;
}

/**
 * Processing Transition State
 */
function renderProcessingState() {
  return `
    <div class="assessment-card processing-card">
      <div class="processing-spinner"></div>
      <h2 class="processing-title">Creating your Horizon Fit report...</h2>

      <div class="processing-checklist">
        <div class="checklist-step" id="proc-step-1">
          <span class="check-icon">✓</span>
          <span>Assessment received</span>
        </div>
        <div class="checklist-step" id="proc-step-2">
          <span class="check-icon">✓</span>
          <span>Health profile prepared</span>
        </div>
        <div class="checklist-step" id="proc-step-3">
          <span class="check-icon">✓</span>
          <span>Report generated</span>
        </div>
        <div class="checklist-step" id="proc-step-4">
          <span class="check-icon">✓</span>
          <span>Sending securely to Horizon Fit</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Step 8: Completion / Success Page
 */
function renderSuccessPage() {
  const d = state.formData;
  const firstName = (d.fullName || 'Client').trim().split(' ')[0];

  return `
    <div class="assessment-card success-card">
      <div class="success-badge-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>

      <h1 class="success-title">Assessment Completed</h1>
      <p class="success-subtitle">Thank you, ${firstName}.</p>

      <p class="success-text">
        Your assessment is complete. Your report is saved and ready to view or download from this page.
      </p>

      <div class="success-status-box">
        <div class="status-row">
          <span class="status-dot"></span>
          <span>Official Basic Metabolic Health Screening Report generated</span>
        </div>
        <div class="status-row">
          <span class="status-dot"></span>
          <span>${state.emailDelivery?.clinic === true ? 'The report was emailed to the Horizon Fit clinical team.' : state.emailDelivery?.clinic === false ? 'The report is saved, but the clinical email could not be sent.' : 'Your health screening report is saved securely.'}</span>
        </div>
        ${d.contactPreference === 'Yes' ? `
          <div class="status-row">
            <span class="status-dot"></span>
            <span>A Horizon Fit team member will contact you on WhatsApp (+91 ${escapeHtml(d.mobile)}) to discuss your responses.</span>
          </div>
        ` : ''}
        ${state.emailDelivery?.respondent === false ? `
          <div class="status-row">
            <span class="status-dot"></span>
            <span>The report is available here, but we could not confirm the email to ${escapeHtml(d.email)}.</span>
          </div>
        ` : ''}
        ${state.emailDelivery?.respondent === true ? `
          <div class="status-row">
            <span class="status-dot"></span>
            <span>The report PDF was emailed to ${escapeHtml(d.email)}.</span>
          </div>
        ` : ''}
      </div>

      <div class="success-actions">
        <button class="btn-download-pdf" id="success-download-pdf-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Health Insight Report (PDF)
        </button>

        <div class="success-sub-actions">
          <button class="btn-view-preview" id="success-view-report-btn">
            🔍 View Screening Report Preview
          </button>
          <button class="btn-email-details" id="success-view-email-btn">
            ✉️ Email Transmission Details
          </button>
        </div>

        <button class="btn-back-home" id="retake-assessment-btn">
          Back to Horizon Fit / Retake Assessment
        </button>
      </div>
    </div>
  `;
}

/**
 * Handles the animated processing sequence and triggers PDF & email generation
 */
async function startProcessingSequence() {
  state.currentStep = 7;
  render();

  const step1 = document.getElementById('proc-step-1');
  const step2 = document.getElementById('proc-step-2');
  const step3 = document.getElementById('proc-step-3');
  const step4 = document.getElementById('proc-step-4');

  // Animation Timeline
  setTimeout(() => step1?.classList.add('is-done'), 400);
  setTimeout(() => step2?.classList.add('is-done'), 900);

  const filename = formatFilename(state.formData.fullName, state.formData.assessmentDate);
  let reportAccessToken = '';
  let emailDelivery = {};

  try {
    const pdfBytes = await generateHealthInsightPdf(state.formData);
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.formData.generatedPdfBlob = pdfBlob;
    state.formData.generatedPdfUrl = URL.createObjectURL(pdfBlob);
    state.formData.generatedPdfFilename = filename;
    setTimeout(() => step3?.classList.add('is-done'), 1500);

    const submission = new FormData();
    const { generatedPdfBlob, generatedPdfUrl, generatedPdfFilename, ...assessmentData } = state.formData;
    submission.append('formData', JSON.stringify(assessmentData));
    submission.append('report', pdfBlob, filename);

    const apiBaseUrl = getApiBaseUrl();

    console.log('[Assessment] Submitting to:', `${apiBaseUrl}/public/health-assessment`);

    const response = await fetch(`${apiBaseUrl}/public/health-assessment`, {
      method: 'POST',
      body: submission,
    });

    const delivery = await response.json().catch(() => ({}));

    console.log('[Assessment] Response status:', response.status, 'Body:', delivery);

    if (!response.ok) {
      const message = response.status === 404
        ? 'The assessment service is not available yet. Please try again shortly.'
        : delivery.message || 'The report could not be sent. Please try again.';
      throw new Error(message);
    }
    if (!delivery.accessToken) throw new Error('The report was sent, but its secure access link was not returned.');

    reportAccessToken = delivery.accessToken;
    emailDelivery = delivery.emailDelivery || {};
    activeEmailPayload = prepareEmailPayload(state.formData, filename, delivery);
    state.errors.submission = '';
  } catch (err) {
    console.error('[Assessment] Submission error:', err);
    const userMessage = err.message || 'The report could not be sent. Please try again.';
    state.errors.submission = userMessage;
    state.currentStep = 6;
    render();
    // Scroll to error message so user sees it
    setTimeout(() => {
      const errEl = document.querySelector('.form-error-msg[role="alert"]');
      if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return;
  }

  step4?.classList.add('is-done');
  try {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#19483f', '#167769', '#bd783f', '#42a18f']
    });
  } catch (e) { }

  localStorage.setItem('horizonfit-report-token', reportAccessToken);
  state.emailDelivery = emailDelivery;
  state.currentStep = 8;
  render();
}

/**
 * Renders the interactive 2-Page Health Insight Report Modal
 */
function openReportPreviewModal() {
  const d = state.formData;
  const screening = getScreeningDetails(d);
  const patientName = d.fullName || 'Sample Patient';
  const assessmentDate = formatAssessmentDate(d.assessmentDate);

  reportModalContentEl.innerHTML = `
    <div class="report-sheets-wrapper">
      <div class="report-sheet">
        <div class="template-header">
          <div class="template-header-left">
            <div class="template-brand-title">HORIZON FIT - BASIC METABOLIC HEALTH SCREENING</div>
            <div class="template-report-title">Preliminary Screening Report</div>
            <div class="template-report-sub">Assessment Date: ${escapeHtml(assessmentDate)}</div>
          </div>
          <div class="template-header-right">
            <img src="/horizonfit_h_logo.png" alt="Horizon Fit" class="template-logo-img" />
          </div>
        </div>

        <div class="template-purpose-box">
          <div class="template-box-title">Purpose</div>
          <div class="template-box-text">
            A preliminary screening to identify possible metabolic health risk factors and help determine whether further assessment may be appropriate.
          </div>
        </div>

        <div class="template-section-title">01 — HEALTH PROFILE</div>
        <table class="template-profile-table">
          <tr>
            <td class="cell-label" style="width: 19%;">Full Name</td>
            <td class="cell-val" style="width: 31%;">${escapeHtml(patientName)}</td>
            <td class="cell-label" style="width: 25%;">Age</td>
            <td class="cell-val" style="width: 25%;">${escapeHtml(d.age || '--')} years</td>
          </tr>
          <tr>
            <td class="cell-label">Gender</td>
            <td class="cell-val">${escapeHtml(d.gender || 'Not specified')}</td>
            <td class="cell-label">Height</td>
            <td class="cell-val">${escapeHtml(d.height || '--')} cm</td>
          </tr>
          <tr>
            <td class="cell-label">Weight</td>
            <td class="cell-val">${escapeHtml(d.weight || '--')} kg</td>
            <td class="cell-label">Waist Circumference</td>
            <td class="cell-val">${escapeHtml(d.waist || '--')} cm</td>
          </tr>
        </table>

        <div class="template-section-title">02 — BODY MEASUREMENTS</div>
        <table class="template-measurements-table">
          <thead>
            <tr>
              <th style="width: 23%;">Measurement</th>
              <th style="width: 17%;">Your Value</th>
              <th style="width: 22%;">Reference</th>
              <th style="width: 38%;">Finding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>BMI</td>
              <td>${screening.bmi ? screening.bmi.toFixed(1) + ' kg/m²' : '--'}</td>
              <td>${screening.bmiReference}</td>
              <td>${screening.bmiFinding}</td>
            </tr>
            <tr>
              <td>Waist Circumference</td>
              <td>${escapeHtml(d.waist || '--')} cm</td>
              <td>${screening.waistRef}</td>
              <td>${screening.waistFinding}</td>
            </tr>
          </tbody>
        </table>

        <div class="template-section-title">03 — SCREENING FINDINGS</div>
        <table class="template-findings-table">
          <tr>
            <td class="cell-label" style="width: 27%;">Diabetes History</td>
            <td class="cell-val" style="width: 73%;">${screening.diabetesHistory}</td>
          </tr>
          <tr>
            <td class="cell-label">Family History</td>
            <td class="cell-val">${screening.familyHistory}</td>
          </tr>
          <tr>
            <td class="cell-label">Blood Pressure History</td>
            <td class="cell-val">${screening.bloodPressureHistory}</td>
          </tr>
          <tr>
            <td class="cell-label">Physical Activity</td>
            <td class="cell-val">${screening.physicalActivity}</td>
          </tr>
          <tr>
            <td class="cell-label">Health History</td>
            <td class="cell-val">${screening.healthHistory}</td>
          </tr>
        </table>

        <div class="template-section-title">04 — SCREENING RESULT</div>
        <div class="template-callout-box">
          ${screening.screeningResult}
        </div>

        <div class="template-section-title">05 — KEY FACTORS IDENTIFIED</div>
        <ul class="template-bullet-grid">
          ${screening.keyFactors.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>

        <div class="template-section-title">06 — PRIMARY HEALTH GOAL</div>
        <div class="template-goal-box">
          ${escapeHtml(screening.primaryGoal)}
        </div>

        <div class="template-section-title">07 — RECOMMENDED NEXT STEP</div>
        <p class="template-next-step-text">
          ${screening.recommendedNextStep}
        </p>

        <div class="template-note-section">
          <div class="template-note-title">IMPORTANT NOTE</div>
          <p class="template-note-text">
            ${screening.importantNote}
          </p>
        </div>

        <div class="template-footer">
          <div class="template-footer-brand">HORIZON FIT • Doctor-Led Metabolic Health Transformation</div>
          <div class="template-footer-address">Corporate Office: No. 23, Made Koil St, Thirumurugan Nagar, Urapakkam, Chennai – 603211 • Mob: 8925534176 • horizonfit.in • info@horizonfit.in</div>
        </div>
      </div>
    </div>
  `;

  reportModalEl.style.display = 'flex';
}

/**
 * Renders Email Transmission Summary Modal
 */
function openEmailModal() {
  if (!activeEmailPayload) {
    const filename = formatFilename(state.formData.fullName, state.formData.assessmentDate);
    activeEmailPayload = prepareEmailPayload(state.formData, filename);
  }

  emailModalContentEl.innerHTML = `
    <div class="email-meta-card">
      <div class="email-meta-row">
        <span class="email-meta-key">To:</span>
        <span class="email-meta-val">${escapeHtml(activeEmailPayload.recipient || 'Not sent')}</span>
      </div>
      ${activeEmailPayload.clientEmail ? `
        <div class="email-meta-row">
          <span class="email-meta-key">Client Copy:</span>
          <span class="email-meta-val">${activeEmailPayload.clientEmail}</span>
        </div>
      ` : ''}
      <div class="email-meta-row">
        <span class="email-meta-key">Subject:</span>
        <span class="email-meta-val">${escapeHtml(activeEmailPayload.subject)}</span>
      </div>
      <div class="email-meta-row">
        <span class="email-meta-key">Attachment:</span>
        <span class="email-meta-val" style="color: var(--teal); font-weight: 700;">📎 ${escapeHtml(activeEmailPayload.attachmentFilename)}</span>
      </div>
      <div class="email-meta-row">
        <span class="email-meta-key">Status:</span>
        <span class="email-meta-val" style="color: ${activeEmailPayload.status.startsWith('Saved report link emailed') ? '#10B981' : '#B45309'}; font-weight: 700;">${escapeHtml(activeEmailPayload.status)}</span>
      </div>
    </div>

  `;

  emailModalEl.style.display = 'flex';
}

/**
 * Event Listeners and Dynamic Form Synchronization
 */
function attachEventListeners() {
  // Navigation / Landing Events
  document.getElementById('start-assessment-btn')?.addEventListener('click', () => {
    state.currentStep = 1;
    render();
  });
  document.getElementById('header-cta-btn')?.addEventListener('click', () => {
    if (state.currentStep === 0) {
      state.currentStep = 1;
      render();
    }
  });
  document.getElementById('secondary-cta-btn')?.addEventListener('click', () => {
    window.open('https://horizonfit.in', '_blank');
  });
  document.getElementById('nav-brand-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.currentStep = 0;
    render();
  });
  // Step Form Back Buttons
  document.getElementById('back-step-btn')?.addEventListener('click', () => {
    if (state.returnToReview) {
      state.returnToReview = false;
      state.currentStep = 6;
      render();
    } else if (state.currentStep > 1) {
      state.currentStep -= 1;
      render();
    } else {
      state.currentStep = 0;
      render();
    }
  });

  // Jump from Review to Step
  document.querySelectorAll('[data-jump-step]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetStep = parseInt(e.currentTarget.getAttribute('data-jump-step'), 10);
      state.returnToReview = true;
      state.currentStep = targetStep;
      render();
    });
  });

  document.getElementById('back-from-review-btn')?.addEventListener('click', () => {
    state.currentStep = 5;
    render();
  });

  // Confirmation Checkbox in Review
  const confirmCheck = document.getElementById('confirm-accurate-check');
  if (confirmCheck) {
    confirmCheck.addEventListener('change', (e) => {
      state.formData.confirmedAccurate = e.target.checked;
      if (state.formData.confirmedAccurate && state.errors.confirmedAccurate) {
        delete state.errors.confirmedAccurate;
        const errMsg = document.querySelector('.form-error-msg');
        if (errMsg) errMsg.remove();
      }
    });
  }

  // Complete Assessment Button
  document.getElementById('complete-assessment-btn')?.addEventListener('click', () => {
    const { isValid, errors } = validateStep(6, state.formData);
    if (!isValid) {
      state.errors = errors;
      render();
      return;
    }
    state.errors = {};
    startProcessingSequence();
  });

  // Success Screen Actions
  document.getElementById('success-download-pdf-btn')?.addEventListener('click', () => {
    triggerPdfDownload();
  });
  document.getElementById('success-view-report-btn')?.addEventListener('click', () => {
    openReportPreviewModal();
  });
  document.getElementById('success-view-email-btn')?.addEventListener('click', () => {
    openEmailModal();
  });
  document.getElementById('report-view-btn')?.addEventListener('click', () => {
    openReportPreviewModal();
  });
  document.getElementById('report-download-btn')?.addEventListener('click', () => {
    triggerPdfDownload();
  });
  document.getElementById('retake-assessment-btn')?.addEventListener('click', () => {
    localStorage.removeItem('horizonfit-report-token');
    state = JSON.parse(JSON.stringify(INITIAL_STATE));
    state.currentStep = 1;
    activeEmailPayload = null;
    reportPageError = '';
    render();
  });

  // Live Input Bindings
  const step = state.currentStep;
  const form = document.getElementById('step-form');

  if (form) {
    // Text and Number Inputs
    ['fullName', 'mobile', 'email', 'age', 'height', 'weight', 'waist'].forEach(fieldId => {
      const el = document.getElementById(`field-${fieldId}`);
      if (el) {
        el.addEventListener('input', (e) => {
          state.formData[fieldId] = e.target.value;
          if (state.errors[fieldId]) {
            delete state.errors[fieldId];
            el.classList.remove('is-invalid');
            const errDiv = el.closest('.form-group')?.querySelector('.form-error-msg');
            if (errDiv) errDiv.remove();
          }
          // Dynamic live BMI update if height/weight changed
          if ((fieldId === 'height' || fieldId === 'weight') && state.formData.height && state.formData.weight) {
            updateLiveBmiPreview();
          }
        });
      }
    });

    // Single Select Option Cards
    document.querySelectorAll('.option-card[data-field]').forEach(card => {
      card.addEventListener('click', (e) => {
        const fieldName = card.getAttribute('data-field');
        const val = card.getAttribute('data-val');

        if (fieldName === 'condition-multiselect') {
          handleConditionToggle(val);
          return;
        }

        state.formData[fieldName] = val;
        // Visual selection update
        card.closest('.options-grid').querySelectorAll(`.option-card[data-field="${fieldName}"]`).forEach(c => {
          c.classList.remove('is-selected');
        });
        card.classList.add('is-selected');

        if (state.errors[fieldName]) {
          delete state.errors[fieldName];
          card.closest('.form-group')?.querySelector('.form-error-msg')?.remove();
        }
      });
    });

    // Form Submit Handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { isValid, errors } = validateStep(step, state.formData);
      if (!isValid) {
        state.errors = errors;
        render();
        return;
      }
      state.errors = {};

      if (state.returnToReview) {
        state.returnToReview = false;
        state.currentStep = 6;
      } else if (step === 5) {
        state.currentStep = 6;
      } else {
        state.currentStep = step + 1;
      }
      render();
    });
  }
}

/**
 * Updates live BMI preview inside Step 2 without re-rendering the whole form
 */
function updateLiveBmiPreview() {
  const d = state.formData;
  const { bmi, category, riskLevel } = calculateBMI(d.height, d.weight);
  let box = document.querySelector('.live-bmi-calc-box');

  const bmiBadgeClass = riskLevel === 'normal' ? 'bmi-desirable' : (riskLevel === 'warning' ? 'bmi-warning' : 'bmi-elevated');

  if (bmi > 0) {
    if (!box) {
      box = document.createElement('div');
      box.className = 'live-bmi-calc-box';
      const waistGroup = document.getElementById('field-waist')?.closest('.form-group');
      waistGroup?.parentNode.insertBefore(box, waistGroup.nextSibling);
    }
    box.innerHTML = `
      <div class="live-bmi-label">
        <span class="live-bmi-title">Calculated BMI</span>
        <span class="live-bmi-value">${bmi} <small style="font-size: 0.9rem; font-weight: normal; color: var(--secondary-text);">kg/m²</small></span>
      </div>
      <span class="live-bmi-tag ${bmiBadgeClass}">${category}</span>
    `;
  }
}

/**
 * Multi-select condition toggle with mutual exclusivity for "None of the Above"
 */
function handleConditionToggle(val) {
  let conditions = [...(state.formData.conditions || [])];

  if (val === 'None of the Above') {
    conditions = ['None of the Above'];
  } else {
    // Remove 'None of the Above' if selecting another condition
    conditions = conditions.filter(c => c !== 'None of the Above');
    if (conditions.includes(val)) {
      conditions = conditions.filter(c => c !== val);
    } else {
      conditions.push(val);
    }
    if (conditions.length === 0) {
      conditions = ['None of the Above'];
    }
  }

  state.formData.conditions = conditions;

  // Refresh selection visual classes
  document.querySelectorAll('.option-card[data-field="condition-multiselect"]').forEach(card => {
    const cardVal = card.getAttribute('data-val');
    if (conditions.includes(cardVal)) {
      card.classList.add('is-selected');
    } else {
      card.classList.remove('is-selected');
    }
  });

  if (state.errors.conditions) {
    delete state.errors.conditions;
    document.querySelector('.form-group:has([data-field="condition-multiselect"]) .form-error-msg')?.remove();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial Boot
if (savedReportToken) {
  loadReportPage();
} else {
  render();
}
