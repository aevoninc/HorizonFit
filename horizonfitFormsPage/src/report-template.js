function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function createHealthInsightReportMarkup(formData, screening, assessmentDate, logoSrc = '/horizonfit_logo.png') {
    const patientName = formData.fullName || 'Sample Patient';

    return `
    <div class="report-sheet">
      <div class="template-header">
        <div class="template-header-left">
          <div class="template-brand-title">HORIZON FIT - BASIC METABOLIC HEALTH SCREENING</div>
          <div class="template-report-title">Preliminary Screening Report</div>
          <div class="template-report-sub">Assessment Date: ${escapeHtml(assessmentDate)}</div>
        </div>
        <div class="template-header-right">
          <img src="${escapeHtml(logoSrc)}" alt="Horizon Fit" class="template-logo-img" />
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
          <td class="cell-val" style="width: 25%;">${escapeHtml(formData.age || '--')} years</td>
        </tr>
        <tr>
          <td class="cell-label">Gender</td>
          <td class="cell-val">${escapeHtml(formData.gender || 'Not specified')}</td>
          <td class="cell-label">Height</td>
          <td class="cell-val">${escapeHtml(formData.height || '--')} cm</td>
        </tr>
        <tr>
          <td class="cell-label">Weight</td>
          <td class="cell-val">${escapeHtml(formData.weight || '--')} kg</td>
          <td class="cell-label">Waist Circumference</td>
          <td class="cell-val">${escapeHtml(formData.waist || '--')} cm</td>
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
            <td>${escapeHtml(screening.bmiReference)}</td>
            <td>${escapeHtml(screening.bmiFinding)}</td>
          </tr>
          <tr>
            <td>Waist Circumference</td>
            <td>${escapeHtml(formData.waist || '--')} cm</td>
            <td>${escapeHtml(screening.waistRef)}</td>
            <td>${escapeHtml(screening.waistFinding)}</td>
          </tr>
        </tbody>
      </table>

      <div class="template-section-title">03 — SCREENING FINDINGS</div>
      <table class="template-findings-table">
        <tr>
          <td class="cell-label" style="width: 27%;">Diabetes History</td>
          <td class="cell-val" style="width: 73%;">${escapeHtml(screening.diabetesHistory)}</td>
        </tr>
        <tr>
          <td class="cell-label">Family History</td>
          <td class="cell-val">${escapeHtml(screening.familyHistory)}</td>
        </tr>
        <tr>
          <td class="cell-label">Blood Pressure History</td>
          <td class="cell-val">${escapeHtml(screening.bloodPressureHistory)}</td>
        </tr>
        <tr>
          <td class="cell-label">Physical Activity</td>
          <td class="cell-val">${escapeHtml(screening.physicalActivity)}</td>
        </tr>
        <tr>
          <td class="cell-label">Health History</td>
          <td class="cell-val">${escapeHtml(screening.healthHistory)}</td>
        </tr>
      </table>

      <div class="template-section-title">04 — SCREENING RESULT</div>
      <div class="template-callout-box">
        ${escapeHtml(screening.screeningResult)}
      </div>
      <div class="template-result-details">
        ${screening.resultDetails.map(detail => `<p>${escapeHtml(detail)}</p>`).join('')}
      </div>

      <div class="template-section-title">05 — KEY FACTORS IDENTIFIED</div>
      <ul class="template-bullet-grid">
        ${screening.keyFactors.map(factor => `<li>${escapeHtml(factor)}</li>`).join('')}
      </ul>

      <div class="template-section-title">06 — PRIMARY HEALTH GOAL</div>
      <div class="template-goal-box">
        ${escapeHtml(screening.primaryGoal)}
      </div>

      <div class="template-section-title">07 — RECOMMENDED NEXT STEP</div>
      <p class="template-next-step-text">
        ${escapeHtml(screening.recommendedNextStep)}
      </p>

      <div class="template-note-section">
        <div class="template-note-title">IMPORTANT NOTE</div>
        <p class="template-note-text">
          ${escapeHtml(screening.importantNote)}
        </p>
      </div>

      <div class="template-footer">
        <div class="template-footer-brand">HORIZON FIT • Doctor-Led Metabolic Health Transformation</div>
        <div class="template-footer-address">Corporate Office: No. 23, Made Koil St, Thirumurugan Nagar, Urapakkam, Chennai – 603211 • Mob: 8925534176 • horizonfit.in • info@horizonfit.in</div>
      </div>
    </div>
  `;
}