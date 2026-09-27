import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getScreeningDetails } from './calculations.js';

// Brand Color Palette in RGB (0-1) strictly matching official template
const COLORS = {
  headerTeal: rgb(0.082, 0.294, 0.369),    // #154B5E - Document title & primary headings
  deepTeal: rgb(0.043, 0.306, 0.357),      // #0B4E5B - Measurements table header
  calloutBorder: rgb(0.157, 0.502, 0.573), // #288092 - Result callout outline
  calloutBg: rgb(0.929, 0.969, 0.976),     // #EDF7F9 - Result callout background
  darkText: rgb(0.102, 0.137, 0.153),      // #1A2327 - Labels & bold text
  bodyText: rgb(0.125, 0.161, 0.188),      // #202930 - Table cell values & bullets
  subtleText: rgb(0.243, 0.314, 0.357),    // #3E505B - Secondary copy & subtitle
  mutedText: rgb(0.443, 0.502, 0.588),     // #718096 - Footer office line & date
  borderLight: rgb(0.886, 0.910, 0.941),   // #E2E8F0 - Grid lines & subtle borders
  bgLight: rgb(0.973, 0.980, 0.988),       // #F8FAFC - Purpose & Goal boxes
  white: rgb(1.000, 1.000, 1.000)
};

/**
 * Text wrapper for PDF standard fonts
 */
function wrapText(text, maxWidth, font, fontSize) {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Formats assessment date cleanly to match template ("24 September 2026")
 */
export function formatAssessmentDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const str = String(dateStr).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  return str;
}

/**
 * Generates the official 1-Page Horizon Fit Basic Metabolic Health Screening PDF Report
 * strictly engineered to fill the entire A4 page completely and proportionately from top to bottom.
 */
export async function generateHealthInsightPdf(formData, logoPngBytes = null) {
  const pdfDoc = await PDFDocument.create();

  // Load Standard Type 1 Fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed logo image if available (from parameter, browser fetch, or Node environment)
  let logoImage = null;
  try {
    let bytes = logoPngBytes;
    if (!bytes && typeof window !== 'undefined') {
      try {
        const response = await fetch('/horizonfit_h_logo.png');
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          bytes = new Uint8Array(buffer);
        }
      } catch (e) {
        console.warn('Could not fetch logo in browser:', e);
      }
    }

    if (bytes) {
      logoImage = await pdfDoc.embedPng(bytes);
    }
  } catch (err) {
    console.warn('Could not load logo image for PDF:', err);
  }

  // Clinical screening and metric interpretations
  const screening = getScreeningDetails(formData);

  // A4 Page geometry
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 42;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_LEFT * 2); // 511.28 pt

  const patientName = formData.fullName || 'Sample Patient';
  const assessmentDate = formatAssessmentDate(formData.assessmentDate);

  // Key factors grid layout calculation
  const keyFactors = screening.keyFactors;
  const halfCount = Math.ceil(keyFactors.length / 2);
  const col1Factors = keyFactors.slice(0, halfCount);
  const col2Factors = keyFactors.slice(halfCount);

  // Dynamic spacing budget to guarantee the report gracefully fills the whole page
  const hasExtraBullets = halfCount >= 3;
  const tblRowH = hasExtraBullets ? 23.5 : 24.5;
  const secGap = hasExtraBullets ? 15.5 : 17.5;
  const bulletRowH = hasExtraBullets ? 15 : 17;

  /* ========================================================
     SINGLE-PAGE BASIC METABOLIC HEALTH SCREENING REPORT
     ======================================================== */
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // ----------------------------------------------------
  // 1. DOCUMENT HEADER
  // ----------------------------------------------------
  const titleY = 806;
  page.drawText('HORIZON FIT - BASIC METABOLIC HEALTH SCREENING', {
    x: MARGIN_LEFT,
    y: titleY,
    size: 13,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const subtitleY = titleY - 14.5;
  page.drawText('Preliminary Screening Report', {
    x: MARGIN_LEFT,
    y: subtitleY,
    size: 9.2,
    font: helvetica,
    color: COLORS.subtleText
  });

  const dateY = subtitleY - 13.5;
  page.drawText(`Assessment Date: ${assessmentDate}`, {
    x: MARGIN_LEFT,
    y: dateY,
    size: 8.2,
    font: helvetica,
    color: COLORS.mutedText
  });

  // Top Right: Official Horizon Fit 'H' Emblem Logo
  if (logoImage) {
    const logoW = 54;
    const logoAspect = logoImage.width / logoImage.height;
    const logoH = logoW / logoAspect;
    page.drawImage(logoImage, {
      x: MARGIN_LEFT + CONTENT_WIDTH - logoW,
      y: 760,
      width: logoW,
      height: logoH
    });
  }

  // ----------------------------------------------------
  // 2. PURPOSE BOX
  // ----------------------------------------------------
  const purposeTopY = dateY - 18;
  const purposeBoxH = 40;
  const purposeBoxY = purposeTopY - purposeBoxH;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: purposeBoxY,
    width: CONTENT_WIDTH,
    height: purposeBoxH,
    color: COLORS.bgLight,
    borderColor: COLORS.borderLight,
    borderWidth: 0.5
  });

  page.drawText('Purpose', {
    x: MARGIN_LEFT + 11,
    y: purposeBoxY + 23,
    size: 8.2,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  page.drawText(
    'A preliminary screening to identify possible metabolic health risk factors and help determine whether further assessment may be appropriate.',
    {
      x: MARGIN_LEFT + 11,
      y: purposeBoxY + 10,
      size: 7.5,
      font: helvetica,
      color: COLORS.subtleText
    }
  );

  // ----------------------------------------------------
  // 3. SECTION 01 — HEALTH PROFILE
  // ----------------------------------------------------
  const sec1HeadingY = purposeBoxY - secGap;
  page.drawText('01 — HEALTH PROFILE', {
    x: MARGIN_LEFT,
    y: sec1HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  // Table 01: 3 rows, 4 columns
  const tbl1TopY = sec1HeadingY - 11;
  const tbl1RowH = tblRowH;
  const tbl1TotalH = tbl1RowH * 3;
  const tbl1BottomY = tbl1TopY - tbl1TotalH;

  const col1X = MARGIN_LEFT;
  const col2X = MARGIN_LEFT + 98;
  const col3X = MARGIN_LEFT + 252;
  const col4X = MARGIN_LEFT + 382;

  // Outer border & background
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: tbl1BottomY,
    width: CONTENT_WIDTH,
    height: tbl1TotalH,
    color: COLORS.white,
    borderColor: COLORS.borderLight,
    borderWidth: 0.5
  });

  // Horizontal dividers
  page.drawLine({
    start: { x: MARGIN_LEFT, y: tbl1TopY - tbl1RowH },
    end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: tbl1TopY - tbl1RowH },
    thickness: 0.5,
    color: COLORS.borderLight
  });
  page.drawLine({
    start: { x: MARGIN_LEFT, y: tbl1TopY - tbl1RowH * 2 },
    end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: tbl1TopY - tbl1RowH * 2 },
    thickness: 0.5,
    color: COLORS.borderLight
  });

  // Vertical dividers
  [col2X, col3X, col4X].forEach((xVal) => {
    page.drawLine({
      start: { x: xVal, y: tbl1TopY },
      end: { x: xVal, y: tbl1BottomY },
      thickness: 0.5,
      color: COLORS.borderLight
    });
  });

  // Row 1: Full Name | Age
  const r1MidY = tbl1TopY - tbl1RowH + 8;
  page.drawText('Full Name', { x: col1X + 9, y: r1MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(patientName, { x: col2X + 9, y: r1MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText('Age', { x: col3X + 9, y: r1MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(`${formData.age || '--'} years`, { x: col4X + 9, y: r1MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });

  // Row 2: Gender | Height
  const r2MidY = tbl1TopY - (tbl1RowH * 2) + 8;
  page.drawText('Gender', { x: col1X + 9, y: r2MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(formData.gender || 'Not specified', { x: col2X + 9, y: r2MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText('Height', { x: col3X + 9, y: r2MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(`${formData.height || '--'} cm`, { x: col4X + 9, y: r2MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });

  // Row 3: Weight | Waist Circumference
  const r3MidY = tbl1BottomY + 8;
  page.drawText('Weight', { x: col1X + 9, y: r3MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(`${formData.weight || '--'} kg`, { x: col2X + 9, y: r3MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText('Waist Circumference', { x: col3X + 9, y: r3MidY, size: 8.2, font: helveticaBold, color: COLORS.darkText });
  page.drawText(`${formData.waist || '--'} cm`, { x: col4X + 9, y: r3MidY, size: 8.2, font: helvetica, color: COLORS.bodyText });

  // ----------------------------------------------------
  // 4. SECTION 02 — BODY MEASUREMENTS
  // ----------------------------------------------------
  const sec2HeadingY = tbl1BottomY - secGap;
  page.drawText('02 — BODY MEASUREMENTS', {
    x: MARGIN_LEFT,
    y: sec2HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const tbl2TopY = sec2HeadingY - 11;
  const tbl2HeaderH = tbl1RowH;
  const tbl2RowH = tbl1RowH;
  const tbl2TotalH = tbl2HeaderH + (tbl2RowH * 2);
  const tbl2BottomY = tbl2TopY - tbl2TotalH;

  const mCol1X = MARGIN_LEFT;
  const mCol2X = MARGIN_LEFT + 115;
  const mCol3X = MARGIN_LEFT + 205;
  const mCol4X = MARGIN_LEFT + 315;

  // Header row background (Deep Teal)
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: tbl2TopY - tbl2HeaderH,
    width: CONTENT_WIDTH,
    height: tbl2HeaderH,
    color: COLORS.deepTeal
  });

  // Header labels
  const mHdrTextY = tbl2TopY - tbl2HeaderH + 8;
  page.drawText('Measurement', { x: mCol1X + 9, y: mHdrTextY, size: 8.2, font: helveticaBold, color: COLORS.white });
  page.drawText('Your Value', { x: mCol2X + 9, y: mHdrTextY, size: 8.2, font: helveticaBold, color: COLORS.white });
  page.drawText('Reference', { x: mCol3X + 9, y: mHdrTextY, size: 8.2, font: helveticaBold, color: COLORS.white });
  page.drawText('Finding', { x: mCol4X + 9, y: mHdrTextY, size: 8.2, font: helveticaBold, color: COLORS.white });

  // Data rows outer border & background
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: tbl2BottomY,
    width: CONTENT_WIDTH,
    height: tbl2RowH * 2,
    color: COLORS.white,
    borderColor: COLORS.borderLight,
    borderWidth: 0.5
  });

  // Horizontal divider between BMI row and Waist row
  page.drawLine({
    start: { x: MARGIN_LEFT, y: tbl2BottomY + tbl2RowH },
    end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: tbl2BottomY + tbl2RowH },
    thickness: 0.5,
    color: COLORS.borderLight
  });

  // Vertical dividers for data rows
  [mCol2X, mCol3X, mCol4X].forEach((xVal) => {
    page.drawLine({
      start: { x: xVal, y: tbl2TopY - tbl2HeaderH },
      end: { x: xVal, y: tbl2BottomY },
      thickness: 0.5,
      color: COLORS.borderLight
    });
  });

  // Table 02, Row 1: BMI
  const bmiRowMidY = tbl2BottomY + tbl2RowH + 8;
  page.drawText('BMI', { x: mCol1X + 9, y: bmiRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(`${screening.bmi.toFixed(1)} kg/m²`, { x: mCol2X + 9, y: bmiRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(screening.bmiReference, { x: mCol3X + 9, y: bmiRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(screening.bmiFinding, { x: mCol4X + 9, y: bmiRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });

  // Table 02, Row 2: Waist Circumference
  const waistRowMidY = tbl2BottomY + 8;
  page.drawText('Waist Circumference', { x: mCol1X + 9, y: waistRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(`${formData.waist || '--'} cm`, { x: mCol2X + 9, y: waistRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(screening.waistRef, { x: mCol3X + 9, y: waistRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });
  page.drawText(screening.waistFinding, { x: mCol4X + 9, y: waistRowMidY, size: 8.2, font: helvetica, color: COLORS.bodyText });

  // ----------------------------------------------------
  // 5. SECTION 03 — SCREENING FINDINGS
  // ----------------------------------------------------
  const sec3HeadingY = tbl2BottomY - secGap;
  page.drawText('03 — SCREENING FINDINGS', {
    x: MARGIN_LEFT,
    y: sec3HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const tbl3TopY = sec3HeadingY - 11;
  const tbl3RowH = tbl1RowH;
  const findingsRows = [
    { label: 'Diabetes History', value: screening.diabetesHistory },
    { label: 'Family History', value: screening.familyHistory },
    { label: 'Blood Pressure History', value: screening.bloodPressureHistory },
    { label: 'Physical Activity', value: screening.physicalActivity },
    { label: 'Health History', value: screening.healthHistory }
  ];
  const tbl3TotalH = tbl3RowH * findingsRows.length;
  const tbl3BottomY = tbl3TopY - tbl3TotalH;

  const fCol1X = MARGIN_LEFT;
  const fCol2X = MARGIN_LEFT + 140;

  // Outer border & background
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: tbl3BottomY,
    width: CONTENT_WIDTH,
    height: tbl3TotalH,
    color: COLORS.white,
    borderColor: COLORS.borderLight,
    borderWidth: 0.5
  });

  // Vertical divider between label and description
  page.drawLine({
    start: { x: fCol2X, y: tbl3TopY },
    end: { x: fCol2X, y: tbl3BottomY },
    thickness: 0.5,
    color: COLORS.borderLight
  });

  findingsRows.forEach((item, index) => {
    const rowY = tbl3TopY - (index + 1) * tbl3RowH;
    // Horizontal divider under each row except the last
    if (index < findingsRows.length - 1) {
      page.drawLine({
        start: { x: MARGIN_LEFT, y: rowY },
        end: { x: MARGIN_LEFT + CONTENT_WIDTH, y: rowY },
        thickness: 0.5,
        color: COLORS.borderLight
      });
    }

    const textMidY = rowY + 8;
    page.drawText(item.label, {
      x: fCol1X + 9,
      y: textMidY,
      size: 8.2,
      font: helveticaBold,
      color: COLORS.darkText
    });

    page.drawText(item.value, {
      x: fCol2X + 9,
      y: textMidY,
      size: 8.0,
      font: helvetica,
      color: COLORS.bodyText
    });
  });

  // ----------------------------------------------------
  // 6. SECTION 04 — SCREENING RESULT
  // ----------------------------------------------------
  const sec4HeadingY = tbl3BottomY - secGap;
  page.drawText('04 — SCREENING RESULT', {
    x: MARGIN_LEFT,
    y: sec4HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const calloutTopY = sec4HeadingY - 11;
  const calloutH = 34;
  const calloutY = calloutTopY - calloutH;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: calloutY,
    width: CONTENT_WIDTH,
    height: calloutH,
    color: COLORS.calloutBg,
    borderColor: COLORS.calloutBorder,
    borderWidth: 0.75
  });

  page.drawText(screening.screeningResult, {
    x: MARGIN_LEFT + 12,
    y: calloutY + 12,
    size: 9.2,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  // ----------------------------------------------------
  // 7. SECTION 05 — KEY FACTORS IDENTIFIED (2-Column Grid)
  // ----------------------------------------------------
  const sec5HeadingY = calloutY - secGap;
  page.drawText('05 — KEY FACTORS IDENTIFIED', {
    x: MARGIN_LEFT,
    y: sec5HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const bulletsTopY = sec5HeadingY - 16;
  const colA_X = MARGIN_LEFT + 6;
  const colB_X = MARGIN_LEFT + 250;

  for (let i = 0; i < halfCount; i++) {
    const curY = bulletsTopY - (i * bulletRowH);
    if (col1Factors[i]) {
      page.drawText(`• ${col1Factors[i]}`, {
        x: colA_X,
        y: curY,
        size: 8.2,
        font: helvetica,
        color: COLORS.bodyText
      });
    }
    if (col2Factors[i]) {
      page.drawText(`• ${col2Factors[i]}`, {
        x: colB_X,
        y: curY,
        size: 8.2,
        font: helvetica,
        color: COLORS.bodyText
      });
    }
  }

  const sec5BottomY = bulletsTopY - (halfCount * bulletRowH);

  // ----------------------------------------------------
  // 8. SECTION 06 — PRIMARY HEALTH GOAL
  // ----------------------------------------------------
  const sec6HeadingY = sec5BottomY - (secGap - 2);
  page.drawText('06 — PRIMARY HEALTH GOAL', {
    x: MARGIN_LEFT,
    y: sec6HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const goalBoxTopY = sec6HeadingY - 10;
  const goalBoxH = 30;
  const goalBoxY = goalBoxTopY - goalBoxH;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: goalBoxY,
    width: CONTENT_WIDTH,
    height: goalBoxH,
    color: COLORS.bgLight,
    borderColor: COLORS.borderLight,
    borderWidth: 0.5
  });

  page.drawText(screening.primaryGoal, {
    x: MARGIN_LEFT + 12,
    y: goalBoxY + 9.5,
    size: 10,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  // ----------------------------------------------------
  // 9. SECTION 07 — RECOMMENDED NEXT STEP
  // ----------------------------------------------------
  const sec7HeadingY = goalBoxY - (secGap - 1);
  page.drawText('07 — RECOMMENDED NEXT STEP', {
    x: MARGIN_LEFT,
    y: sec7HeadingY,
    size: 9.5,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  const nextStepLines = wrapText(screening.recommendedNextStep, CONTENT_WIDTH, helvetica, 7.6);
  let nextStepY = sec7HeadingY - 12;
  nextStepLines.forEach((line) => {
    page.drawText(line, {
      x: MARGIN_LEFT,
      y: nextStepY,
      size: 7.6,
      font: helvetica,
      color: COLORS.subtleText
    });
    nextStepY -= 11.2;
  });

  // ----------------------------------------------------
  // 10. IMPORTANT NOTE
  // ----------------------------------------------------
  const noteHeadingY = nextStepY - 4;
  page.drawText('IMPORTANT NOTE', {
    x: MARGIN_LEFT,
    y: noteHeadingY,
    size: 8.0,
    font: helveticaBold,
    color: COLORS.darkText
  });

  const noteLines = wrapText(screening.importantNote, CONTENT_WIDTH, helvetica, 7.2);
  let noteLineY = noteHeadingY - 11;
  noteLines.forEach((line) => {
    page.drawText(line, {
      x: MARGIN_LEFT,
      y: noteLineY,
      size: 7.2,
      font: helvetica,
      color: COLORS.mutedText
    });
    noteLineY -= 10.2;
  });

  // ----------------------------------------------------
  // 11. FOOTER (Positioned to perfectly complete the page)
  // ----------------------------------------------------
  page.drawText('HORIZON FIT • Doctor-Led Metabolic Health Transformation', {
    x: MARGIN_LEFT,
    y: 48,
    size: 7.8,
    font: helveticaBold,
    color: COLORS.headerTeal
  });

  page.drawText(
    'Corporate Office: No. 23, Made Koil St, Thirumurugan Nagar, Urapakkam, Chennai – 603211 • Mob: 8925534176 • horizonfit.in • info@horizonfit.in',
    {
      x: MARGIN_LEFT,
      y: 35,
      size: 7.0,
      font: helvetica,
      color: COLORS.mutedText
    }
  );

  // Return generated 1-Page PDF bytes
  return await pdfDoc.save();
}
