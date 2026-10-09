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

    // Page 1 — Profile, Measurements, Findings
    const page1 = `
    <div class="report-sheet">
      <!-- HEADER -->
      <div class="template-header">
        <div class="template-header-logo">
          <img src="${escapeHtml(logoSrc)}" alt="Horizon Fit" class="template-logo-img" />
        </div>
        <div class="template-header-text">
          <div class="template-brand-title">HORIZON FIT – BASIC METABOLIC<br>HEALTH RISK SCREENING</div>
          <div class="template-report-title">Preliminary Screening Report Assessment.</div>
        </div>
      </div>

      <!-- PURPOSE -->
      <div class="template-purpose-text">
        <strong>Purpose</strong> A preliminary screening to identify possible metabolic health risk factors and help determine whether further assessment may be appropriate.
      </div>

      <div class="template-date-line"><strong>Date:</strong> ${escapeHtml(assessmentDate)}</div>

      <!-- SECTION 01: HEALTH PROFILE -->
      <div class="template-section-title">01 — HEALTH PROFILE</div>
      <table class="template-profile-table">
        <thead>
          <tr>
            <th style="width: 23%;">Full Name</th>
            <th style="width: 12%;">Age</th>
            <th style="width: 15%;">Gender</th>
            <th style="width: 11%;">Height</th>
            <th style="width: 11%;">Weight</th>
            <th style="width: 28%;">Waist<br>Circumference</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(patientName)}</td>
            <td>${escapeHtml(formData.age || '--')} Years</td>
            <td>${escapeHtml(formData.gender || 'Not specified')}</td>
            <td>${escapeHtml(formData.height || '--')} cm</td>
            <td>${escapeHtml(formData.weight || '--')} kg</td>
            <td>${escapeHtml(formData.waist || '--')} cm</td>
          </tr>
        </tbody>
      </table>

      <!-- SECTION 02: BODY MEASUREMENTS -->
      <div class="template-section-title">02 — BODY MEASUREMENTS</div>
      <table class="template-measurements-table">
        <thead>
          <tr>
            <th style="width: 27%;">Measurement</th>
            <th style="width: 18%;">Your Value</th>
            <th style="width: 22%;">Reference</th>
            <th style="width: 33%;">Finding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>BMI</td>
            <td>${screening.bmi ? screening.bmi.toFixed(1) + ' kg/m\u00B2' : '--'}</td>
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

      <!-- SECTION 03: SCREENING FINDINGS -->
      <div class="template-section-title">03 — SCREENING FINDINGS</div>
      <div class="template-findings-card-grid">
        <div class="template-finding-card">
          <div class="template-finding-card-title">Diabetes History</div>
          <div class="template-finding-card-body">${escapeHtml(screening.diabetesHistory)}</div>
        </div>
        <div class="template-finding-card">
          <div class="template-finding-card-title">Family History</div>
          <div class="template-finding-card-body">${escapeHtml(screening.familyHistory)}</div>
        </div>
        <div class="template-finding-card">
          <div class="template-finding-card-title">Blood Pressure History</div>
          <div class="template-finding-card-body">${escapeHtml(screening.bloodPressureHistory)}</div>
        </div>
        <div class="template-finding-card">
          <div class="template-finding-card-title">Physical Activity</div>
          <div class="template-finding-card-body">${escapeHtml(screening.physicalActivity)}</div>
        </div>
        <div class="template-finding-card">
          <div class="template-finding-card-title">Health History</div>
          <div class="template-finding-card-body">${escapeHtml(screening.healthHistory)}</div>
        </div>
      </div>
    </div>
    `;

    // Page 2 — Results, Key Factors, Goal, Next Step, Disclaimer, Footer
    const page2 = `
    <div class="report-sheet">
      <!-- SECTION 04: SCREENING RESULT -->
      <div class="template-section-title">04 — SCREENING RESULT</div>
      <div class="template-result-label ${screening.hasRiskFactors ? 'is-risk' : 'is-clear'}">${escapeHtml(screening.screeningResult)}</div>
      <div class="template-callout-box">
        <div class="template-callout-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#165A68" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div class="template-callout-content">
          ${screening.resultDetails.map(detail => `<p>${escapeHtml(detail)}</p>`).join('')}
        </div>
      </div>

      <!-- SECTION 05: KEY FACTORS IDENTIFIED -->
      <div class="template-section-title">05 — KEY FACTORS IDENTIFIED</div>
      <div class="template-key-factors-grid">
        ${screening.keyFactors.map(factor => `<div class="template-key-factor-card">${escapeHtml(factor)}</div>`).join('')}
      </div>

      <!-- SECTIONS 06 + 07 side by side -->
      <div class="template-goal-next-row">
        <div class="template-goal-card">
          <div class="template-goal-title">06 — PRIMARY<br>HEALTH GOAL</div>
          <div class="template-goal-value">${escapeHtml(screening.primaryGoal)}</div>
        </div>
        <div class="template-next-step-block">
          <div class="template-next-step-title">07 — RECOMMENDED NEXT STEP</div>
          <p class="template-next-step-text">${escapeHtml(screening.recommendedNextStep)}</p>
        </div>
      </div>

      <!-- DISCLAIMER -->
      <div class="template-disclaimer-box">
        <svg class="template-disclaimer-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span class="template-disclaimer-text">${escapeHtml(screening.importantNote)}</span>
      </div>

      <!-- FOOTER PAGE 2 -->
      <div class="template-footer">
        <div class="template-footer-divider"></div>
        <div class="template-footer-brand">HORIZON FIT – Doctor-Led Metabolic Health Transformation</div>
        <div class="template-footer-address">Corporate Office No. 23, Mada Koil St, Thirumangalam Nagar, Adhanur, Urapakkam, Chennai – 603211</div>
        <div class="template-footer-contact">Mob: 8925534176 • horizonfit.in • info@horizonfit.in</div>
      </div>
    </div>
    `;

    return page1 + page2;
}