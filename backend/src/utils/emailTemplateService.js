/**
 * Master Email Template Service
 * Provides premium, responsive HTML structures for all HorizonFit system emails.
 */

/**
 * Renders the master shell for all emails.
 * Includes teal-to-cyan gradient headers, clean typography, and responsive containers.
 */
const renderBaseTemplate = (title, content, link, buttonText, isFunctional = false) => {
    // Brand Colors
    const primaryTeal = "#14b8a6";
    const primaryCyan = "#06b6d4";
    const textSlate = "#1e293b";
    const mutedSlate = "#64748b";
    
    // Functional template (e.g. password reset) uses more subdued colors
    const headerBg = isFunctional ? "#334155" : `linear-gradient(135deg, ${primaryTeal} 0%, ${primaryCyan} 100%)`;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table { border-spacing: 0; }
                img { border: 0; height: auto; outline: none; text-decoration: none; }
                .btn:hover { background-color: #0d9488 !important; }
            </style>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; color: ${textSlate}; line-height: 1.6; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: ${headerBg}; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">HorizonFit</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin-top: 8px; font-size: 14px;">Elevate Your Vitality</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: ${textSlate}; font-size: 20px; font-weight: 700; margin-bottom: 24px; text-align: center;">${title}</h2>
                    <div style="color: ${textSlate}; font-size: 16px;">
                        ${content}
                    </div>
                    
                    ${link ? `
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${link}" class="btn" style="display: inline-block; background-color: ${primaryTeal}; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 16px;">
                            ${buttonText}
                        </a>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: ${mutedSlate}; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} HorizonFit by Aevon Inc. All rights reserved.</p>
                    <p style="color: ${mutedSlate}; font-size: 12px; margin-top: 8px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * 1. Patient Welcome Email
 */
const patientWelcomeTemplate = (patientName, assignedDoctorName, email, password) => {
    const title = `Welcome to Your Transformation, ${patientName}!`;
    const content = `
        <p>Dear ${patientName},</p>
        <p>I am thrilled to welcome you to the HorizonFit family. Your journey toward peak vitality starts today.</p>
        
        <p style="font-style: italic; color: #115e59; border-left: 4px solid #14b8a6; padding-left: 16px; margin: 24px 0;">
            "Consistence is the foundation of excellence. We are honored to guide you through every step of this transformation."
            <br><strong>— Dr. M. Jabaarrul</strong>
        </p>

        <h3 style="color: #0f172a; margin-top: 32px;">Your 5-Zone Program Structure</h3>
        <table style="width: 100%; margin-top: 16px;">
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #14b8a6; font-weight: 700;">Zone 1: Foundation</span> — Setting the roots</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #14b8a6; font-weight: 700;">Zone 2: Momentum</span> — Building the drive</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #14b8a6; font-weight: 700;">Zone 3: Transformation</span> — The core shift</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #14b8a6; font-weight: 700;">Zone 4: Mastery</span> — Refined control</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><span style="color: #14b8a6; font-weight: 700;">Zone 5: Freedom</span> — Sustainable excellence</td>
            </tr>
        </table>

        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 12px; margin-top: 32px;">
            <p style="margin: 0; font-weight: 700; color: #0f766e;">Your Login Credentials:</p>
            <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 4px 0 0 0;"><strong>Temporary Password:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${password}</code></p>
        </div>

        <p style="margin-top: 24px;">Your assigned specialist is <strong>${assignedDoctorName}</strong>. They will be reviewing your logs and guiding your progress.</p>
    `;

    return renderBaseTemplate(title, content, "https://horizonfit.in/#/login", "Start Your Journey");
};

/**
 * 2. Consultation Booking Confirmation (New centralized template)
 */
const consultationBookingTemplate = (recipientName, otherPartyName, date, time, recipientRole = 'patient') => {
    let title = '';
    let content = '';
    let buttonText = 'View Appointment';

    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (recipientRole === 'patient') {
        title = 'Your Consultation is Booked';
        content = `
            <p>Dear ${recipientName},</p>
            <p>Your consultation with <strong>${otherPartyName}</strong> has been successfully scheduled.</p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 8px 0 0 0;"><strong>⏰ Time:</strong> ${time}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;"><strong>Cancellation Policy:</strong> Please note that cancellations must be made at least 24 hours before the scheduled time to be eligible for a refund or reschedule.</p>
        `;
    } else if (recipientRole === 'doctor') {
        title = 'New Booking Notification';
        content = `
            <p>Dear ${recipientName},</p>
            <p>A new consultation has been booked on your schedule by <strong>${otherPartyName}</strong>.</p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 8px 0 0 0;"><strong>⏰ Time:</strong> ${time}</p>
            </div>
            <p>Please check your doctor dashboard for patient queries or past medical history associated with this log.</p>
        `;
    } else {
        // Admin
        title = 'System: Consultation Summary';
        content = `
            <p>New consultation activity reported:</p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0;"><strong>Patient:</strong> ${recipientName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Specialist:</strong> ${otherPartyName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Schedule:</strong> ${formattedDate} at ${time}</p>
            </div>
        `;
    }

    return renderBaseTemplate(title, content, "https://horizonfit.in/#/appointments", buttonText);
};

/**
 * 3. Consultation Status Update
 */
const consultationUpdateTemplate = (recipientName, otherPartyName, status, dateTime) => {
    const title = `Appointment Update: ${status}`;
    const formattedDate = new Date(dateTime).toLocaleString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    let statusColor = "#64748b";
    let subMessage = "";

    if (status === 'Confirmed') {
        statusColor = "#059669";
        subMessage = "Great! Your session is confirmed. Please join via the link in your dashboard 5 minutes before the start time.";
    } else if (status === 'Completed') {
        statusColor = "#2563eb";
        subMessage = "Your session has concluded. Any reports or prescriptions will be available on your dashboard within 24 hours.";
    } else if (status === 'Cancelled') {
        statusColor = "#dc2626";
        subMessage = "This appointment has been cancelled. If you are eligible for a refund, it will be processed to your source account within 5-7 business days.";
    }

    const content = `
        <p>Dear ${recipientName},</p>
        <p>The status of your appointment with <strong>${otherPartyName}</strong> has been updated.</p>
        
        <div style="text-align: center; margin: 32px 0;">
            <span style="background-color: ${statusColor}; color: #ffffff; padding: 8px 24px; border-radius: 9999px; font-weight: 700; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;">
                ${status}
            </span>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; text-align: center; font-weight: 600;">${formattedDate}</p>
        </div>

        <p style="color: #475569; text-align: center;">${subMessage}</p>
    `;

    return renderBaseTemplate(title, content, "https://horizonfit.in/#/appointments", "Details");
};

/**
 * 4. Password Reset Email
 */
const passwordResetTemplate = (userName, resetLink) => {
    const title = "Password Reset Request";
    const content = `
        <p>Hello ${userName},</p>
        <p>We received a request to reset the password for your HorizonFit account. Click the secure button below to choose a new password.</p>
        
        <p style="font-size: 14px; color: #ef4444; font-weight: 600; margin: 24px 0;">
            This link is valid for 60 minutes only.
        </p>

        <p style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; color: #475569;">
            <strong>Security Notice:</strong> If you did not request this reset, your account is safe and no action is needed. You can ignore this email.
        </p>
    `;

    return renderBaseTemplate(title, content, resetLink, "Reset My Password", true);
};

/**
 * 5. Program Booking Confirmation
 */
const programBookingTemplate = (patientName, specialistName, startDate, planTier, paymentId) => {
    const title = "Enrollment Confirmed";
    const content = `
        <p>Congratulations ${patientName},</p>
        <p>You have successfully enrolled in the <strong>HorizonFit 15-Week Transformation Program</strong>.</p>
        
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin: 32px 0;">
            <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 18px;">Program Summary</h3>
            <p style="margin: 0; color: #0c4a6e;"><strong>Tier:</strong> ${planTier.toUpperCase()}</p>
            <p style="margin: 8px 0 0 0; color: #0c4a6e;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p style="margin: 8px 0 0 0; color: #0c4a6e;"><strong>Assigned Specialist:</strong> ${specialistName}</p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">Receipt ID: ${paymentId}</p>
        </div>

        <h3 style="color: #1e293b;">What to expect next:</h3>
        <ol style="color: #475569; padding-left: 20px;">
            <li>Log in to your dashboard to complete your initial profile metrics.</li>
            <li>Begin watching your first Zone 1 video modules.</li>
            <li>Start logging your daily habits (Nutrition, Exercise, Hydration, Sleep, Mindset).</li>
        </ol>
    `;

    return renderBaseTemplate(title, content, "https://horizonfit.in/#/dashboard", "Access My Dashboard");
};

/**
 * Task Assignment Template (Legacy/Utility)
 */
const taskAssignmentTemplate = (recipientName, otherPartyName, taskName, dueDate, taskDescription) => {
    const title = "New Action Required";
    const content = `
        <p>Hello ${recipientName},</p>
        <p>A new care task has been assigned to your profile by <strong>${otherPartyName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #14b8a6; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-weight: 700; color: #1e293b;">${taskName}</p>
            <p style="margin: 8px 0 0 0; color: #64748b;">${taskDescription}</p>
            <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>Due Date:</strong> ${dueDate}</p>
        </div>
    `;

    return renderBaseTemplate(title, content, "https://horizonfit.in/#/tasks", "View Task Details");
};

export {
    consultationUpdateTemplate,
    consultationBookingTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate
};