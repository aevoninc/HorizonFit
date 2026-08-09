/**
 * Master Email Template Service – HorizonFit
 * Inbox-safe, fully responsive HTML emails.
 * Uses table-based layout (Outlook/Gmail compatible), inline styles, single-column design.
 */

// ─────────────────────────────────────────────
// BASE SHELL
// ─────────────────────────────────────────────
const renderBaseTemplate = (title, content, link, buttonText) => {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style type="text/css">
    body { margin:0; padding:0; background-color:#f1f5f9; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    p { margin:0 0 16px 0; }
    a { color:#14b8a6; }
    .wrapper { width:100%; background-color:#f1f5f9; }
    .container { max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#14b8a6 0%,#06b6d4 100%); padding:36px 24px; text-align:center; }
    .header h1 { color:#ffffff; margin:0; font-size:26px; font-weight:700; font-family:Arial,sans-serif; }
    .header p  { color:rgba(255,255,255,0.88); margin:8px 0 0 0; font-size:13px; font-family:Arial,sans-serif; }
    .body-wrap { padding:36px 28px; }
    .footer { background-color:#f8fafc; padding:24px; text-align:center; border-top:1px solid #e2e8f0; }
    .footer p { color:#94a3b8; font-size:11px; font-family:Arial,sans-serif; margin:4px 0; }
    .info-box { background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin:20px 0; }
    .creds-box { background-color:#f0fdfa; border:1px solid #ccfbf1; border-radius:10px; padding:20px; margin:20px 0; }
    .success-box { background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px; margin:20px 0; }
    .btn-wrap { text-align:center; margin:28px 0 8px 0; }
    .btn { display:inline-block; background-color:#14b8a6; color:#ffffff !important; padding:13px 32px; font-weight:700; text-decoration:none; border-radius:8px; font-size:15px; font-family:Arial,sans-serif; }
    h2 { color:#1e293b; font-size:18px; font-family:Arial,sans-serif; margin:0 0 16px 0; }
    h3 { color:#1e293b; font-size:15px; font-family:Arial,sans-serif; margin:20px 0 8px 0; }
    p,li { font-size:15px; font-family:Arial,sans-serif; color:#334155; line-height:1.65; word-wrap:break-word; overflow-wrap:break-word; }
    code { font-family:Courier,monospace; word-break:break-all; }
    @media screen and (max-width:600px){
      .container { border-radius:0 !important; }
      .body-wrap { padding:24px 18px !important; }
      .header { padding:28px 18px !important; }
      .header h1 { font-size:22px !important; }
      .btn { display:block !important; text-align:center !important; }
    }
  </style>
</head>
<body>
<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td class="header">
            <h1>HorizonFit</h1>
            <p>Elevate Your Vitality</p>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:28px 28px 0 28px; text-align:center;">
            <h2 style="font-size:19px; color:#0f172a; margin:0;">${title}</h2>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="body-wrap">
            ${content}
            ${link ? `<div class="btn-wrap"><a href="${link}" class="btn">${buttonText}</a></div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="footer">
            <p>&copy; ${new Date().getFullYear()} HorizonFit &ndash; Horizon Fit Health Management Pvt. Ltd.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support: <a href="mailto:info@horizonfit.in" style="color:#14b8a6;">info@horizonfit.in</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

// ─────────────────────────────────────────────
// HELPER: key-value info row
// ─────────────────────────────────────────────
const infoRow = (label, value) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
  <tr>
    <td width="38%" style="padding:5px 8px 5px 0; font-size:13px; font-family:Arial,sans-serif; color:#64748b; vertical-align:top; white-space:nowrap;"><strong>${label}</strong></td>
    <td style="padding:5px 0; font-size:14px; font-family:Arial,sans-serif; color:#1e293b; vertical-align:top; word-break:break-word;">${value}</td>
  </tr>
</table>`;

// ─────────────────────────────────────────────
// 1. PATIENT WELCOME EMAIL
// ─────────────────────────────────────────────
const patientWelcomeTemplate = (patientName, assignedDoctorName, email, password) => {
    const title = `Welcome to HorizonFit, ${patientName}!`;
    const content = `
    <p>Dear <strong>${patientName}</strong>,</p>
    <p>I am thrilled to welcome you to the HorizonFit family. Your 15-week journey toward peak vitality starts today.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="border-left:4px solid #14b8a6; padding:12px 16px; background-color:#f0fdfa; border-radius:0 8px 8px 0; font-style:italic; font-size:14px; font-family:Arial,sans-serif; color:#0f766e;">
          &ldquo;Consistency is the foundation of excellence. We are honored to guide you through every step of this transformation.&rdquo;<br>
          <strong style="margin-top:8px;display:block;">&mdash; Dr. M. Jabaarrul</strong>
        </td>
      </tr>
    </table>

    <div class="creds-box">
      <p style="font-weight:700; color:#0f766e; font-size:15px; margin-bottom:12px;">&#128273; Your Login Credentials</p>
      ${infoRow('Email', email)}
      ${infoRow('Password', `<code style="background:#ffffff;padding:3px 8px;border-radius:4px;border:1px solid #e2e8f0;font-weight:700;color:#0f766e;">${password}</code>`)}
      <p style="margin-top:12px;font-size:13px;color:#0d9488;">Login at: <a href="https://horizonfit.in/#/auth" style="color:#14b8a6;font-weight:600;">horizonfit.in</a></p>
    </div>

    <h3>Your 5-Zone Program Structure</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:14px;color:#334155;"><span style="color:#14b8a6;font-weight:700;">Zone 1: Foundation</span> &mdash; Setting the roots</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:14px;color:#334155;"><span style="color:#14b8a6;font-weight:700;">Zone 2: Momentum</span> &mdash; Building the drive</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:14px;color:#334155;"><span style="color:#14b8a6;font-weight:700;">Zone 3: Transformation</span> &mdash; The core shift</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:14px;color:#334155;"><span style="color:#14b8a6;font-weight:700;">Zone 4: Mastery</span> &mdash; Refined control</td></tr>
      <tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;"><span style="color:#14b8a6;font-weight:700;">Zone 5: Freedom</span> &mdash; Sustainable excellence</td></tr>
    </table>

    <p>Your assigned specialist is <strong>${assignedDoctorName}</strong>. They will be reviewing your logs and guiding your progress throughout the program.</p>
  `;
    return renderBaseTemplate(title, content, 'https://horizonfit.in/#/auth', 'Start My Journey');
};

// ─────────────────────────────────────────────
// 2. CONSULTATION BOOKING CONFIRMATION
// ─────────────────────────────────────────────
const consultationBookingTemplate = (recipientName, otherPartyName, date, time, recipientRole = 'patient', bookingId = 'N/A', mobileNumber = 'N/A') => {
    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    let title = '';
    let content = '';

    if (recipientRole === 'patient') {
        title = 'Your Consultation is Confirmed';
        content = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>Your upcoming consultation with <strong>${otherPartyName}</strong> has been successfully scheduled.</p>

      <div class="info-box">
        <p style="font-size:12px;font-family:Arial,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:14px;">Appointment Details</p>
        ${infoRow('Date', formattedDate)}
        ${infoRow('Time', time)}
        ${infoRow('With', otherPartyName)}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Booking ID</td>
          </tr>
          <tr>
            <td style="padding-top:6px;">
              <span style="background:#14b8a6;color:#ffffff;padding:6px 14px;border-radius:6px;font-size:15px;font-weight:700;font-family:Courier,monospace;display:inline-block;word-break:break-all;">${bookingId}</span>
            </td>
          </tr>
        </table>
      </div>

      <div class="success-box">
        <p style="font-weight:700;color:#166534;margin-bottom:10px;">&#10003; Next Steps</p>
        <ul style="margin:0;padding-left:20px;color:#166534;font-size:14px;font-family:Arial,sans-serif;line-height:1.8;">
          <li>Please join the session 5 minutes early for a stable connection.</li>
          <li>Save your Booking ID above &mdash; it is required for program enrollment.</li>
          <li>Cancellations are eligible for a refund within 24 hours of booking.</li>
        </ul>
      </div>

      <p style="color:#64748b;font-size:13px;font-style:italic;">At HorizonFit, personalized care is the cornerstone of sustainable health. We look forward to seeing you soon.</p>
    `;
    } else if (recipientRole === 'doctor') {
        title = 'New Consultation Scheduled';
        content = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>A new consultation has been added to your schedule.</p>

      <div class="info-box">
        <p style="font-size:12px;font-family:Arial,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:14px;">Patient Details</p>
        ${infoRow('Patient', otherPartyName)}
        ${infoRow('Contact', `<a href="tel:${mobileNumber}" style="color:#14b8a6;font-weight:600;text-decoration:none;">${mobileNumber}</a>`)}
        ${infoRow('Date', formattedDate)}
        ${infoRow('Time', time)}
        ${infoRow('Booking Ref', `<span style="font-family:Courier,monospace;word-break:break-all;">${bookingId}</span>`)}
      </div>

      <p>Please review the patient&rsquo;s preliminary query and health history on your specialist dashboard before the session.</p>
    `;
    } else {
        // Admin
        title = 'System: New Consultation Booked';
        content = `
      <p>A new consultation has been recorded in the system.</p>

      <div class="info-box">
        <p style="font-size:12px;font-family:Arial,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:14px;">Event Summary</p>
        ${infoRow('Patient', recipientName)}
        ${infoRow('Contact', mobileNumber)}
        ${infoRow('Specialist', otherPartyName)}
        ${infoRow('Date', formattedDate)}
        ${infoRow('Time', time)}
        ${infoRow('Booking Ref', `<span style="font-family:Courier,monospace;word-break:break-all;">${bookingId}</span>`)}
      </div>
    `;
    }

    return renderBaseTemplate(title, content, 'https://horizonfit.in/#/auth', 'Open Dashboard');
};

// ─────────────────────────────────────────────
// 3. CONSULTATION STATUS UPDATE
// ─────────────────────────────────────────────
const consultationUpdateTemplate = (recipientName, otherPartyName, status, dateTime) => {
    const title = `Appointment ${status}`;
    const formattedDate = new Date(dateTime).toLocaleString('en-IN', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const statusMap = {
        Confirmed: { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', msg: 'Your session is confirmed. Please join via your dashboard link 5 minutes before the start time.' },
        Completed: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', msg: 'Your session has concluded. Any notes or recommendations will be available on your dashboard within 24 hours.' },
        Cancelled: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', msg: 'This appointment has been cancelled. If eligible for a refund, it will be processed to your original payment method within 5-7 business days.' },
    };
    const s = statusMap[status] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', msg: '' };

    const content = `
    <p>Dear <strong>${recipientName}</strong>,</p>
    <p>The status of your appointment with <strong>${otherPartyName}</strong> has been updated.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;text-align:center;">
      <tr>
        <td align="center">
          <span style="background-color:${s.color};color:#ffffff;padding:8px 28px;border-radius:9999px;font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:0.06em;font-family:Arial,sans-serif;display:inline-block;">${status}</span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${s.bg};border:1px solid ${s.border};border-radius:10px;margin:16px 0;">
      <tr>
        <td style="padding:16px;text-align:center;font-family:Arial,sans-serif;font-size:14px;color:${s.color};font-weight:600;">${formattedDate}</td>
      </tr>
    </table>

    ${s.msg ? `<p style="color:#475569;text-align:center;font-size:14px;font-family:Arial,sans-serif;">${s.msg}</p>` : ''}
  `;

    return renderBaseTemplate(title, content, 'https://horizonfit.in/#/auth', 'View Details');
};

// ─────────────────────────────────────────────
// 4. PASSWORD RESET
// ─────────────────────────────────────────────
const passwordResetTemplate = (userName, resetLink) => {
    const title = 'Password Reset Request';
    const content = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>We received a request to reset the password for your HorizonFit account. Click the button below to set a new password.</p>

    <p style="background-color:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:14px;font-size:14px;font-family:Arial,sans-serif;color:#92400e;">
      &#9888; This link is valid for <strong>60 minutes</strong> only. If you did not request a reset, you can safely ignore this email.
    </p>
  `;
    return renderBaseTemplate(title, content, resetLink, 'Reset My Password');
};

// ─────────────────────────────────────────────
// 5. PROGRAM ENROLLMENT CONFIRMATION
// ─────────────────────────────────────────────
const programBookingTemplate = (patientName, specialistName, startDate, planTier, paymentId, email, password, bookingId) => {
    const title = 'Enrollment Confirmed &#127881;';
    const isPatient = Boolean(email && password);

    const content = `
    ${isPatient
            ? `<p>Congratulations <strong>${patientName}</strong>!</p>
         <p>You have successfully enrolled in the <strong>HorizonFit 15-Week Transformation Program</strong>. Your journey to better health begins now.</p>`
            : `<p>A new patient enrollment has been completed.</p>
         <p><strong>Patient:</strong> ${patientName}</p>`
        }

    <div class="info-box">
      <p style="font-size:12px;font-family:Arial,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:14px;">Enrollment Summary</p>
      ${infoRow('Patient', patientName)}
      ${infoRow('Plan', planTier ? planTier.toUpperCase() : 'NORMAL')}
      ${infoRow('Start Date', new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
      ${infoRow('Specialist', specialistName)}
      ${bookingId ? infoRow('Booking ID', `<span style="font-family:Courier,monospace;font-weight:700;word-break:break-all;">${bookingId}</span>`) : ''}
      ${infoRow('Payment Ref', `<span style="font-family:Courier,monospace;font-size:12px;word-break:break-all;">${paymentId}</span>`)}
    </div>

    ${isPatient ? `
    <div class="creds-box">
      <p style="font-weight:700;color:#0f766e;font-size:15px;margin-bottom:12px;">&#128273; Your Login Credentials</p>
      ${infoRow('Email', `<span style="word-break:break-all;">${email}</span>`)}
      ${infoRow('Password', `<code style="background:#ffffff;padding:3px 8px;border-radius:4px;border:1px solid #e2e8f0;font-weight:700;color:#0f766e;word-break:break-all;">${password}</code>`)}
      <p style="margin-top:12px;font-size:13px;color:#0d9488;">Login at: <a href="https://horizonfit.in/#/auth" style="color:#14b8a6;font-weight:600;">horizonfit.in/auth</a></p>
    </div>

    <h3>What to do next:</h3>
    <ol style="margin:8px 0 16px 0;padding-left:22px;color:#475569;font-size:14px;font-family:Arial,sans-serif;line-height:2;">
      <li>Log in to your dashboard and complete your initial health profile.</li>
      <li>Watch your first Zone 1 video modules to understand the program.</li>
      <li>Start logging your daily habits: Nutrition, Exercise, Hydration, Sleep, Mindset.</li>
    </ol>
    ` : ''}
  `;

    return renderBaseTemplate(title, content, 'https://horizonfit.in/#/auth', 'Access My Dashboard');
};

// ─────────────────────────────────────────────
// 6. TASK ASSIGNMENT
// ─────────────────────────────────────────────
const taskAssignmentTemplate = (recipientName, otherPartyName, taskName, dueDate, taskDescription) => {
    const title = 'New Task Assigned';
    const content = `
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>A new care task has been assigned to your profile by <strong>${otherPartyName}</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #14b8a6;border-radius:0 10px 10px 0;margin:16px 0;">
      <tr>
        <td style="padding:18px;">
          <p style="font-weight:700;color:#1e293b;font-size:15px;margin-bottom:8px;">${taskName}</p>
          <p style="color:#64748b;font-size:14px;margin-bottom:10px;">${taskDescription}</p>
          <p style="font-size:13px;color:#334155;margin:0;"><strong>Due Date:</strong> ${dueDate}</p>
        </td>
      </tr>
    </table>
  `;
    return renderBaseTemplate(title, content, 'https://horizonfit.in/#/auth', 'View Task');
};

export {
    consultationUpdateTemplate,
    consultationBookingTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate,
};