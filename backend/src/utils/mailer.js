import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

import {
    consultationUpdateTemplate,
    consultationBookingTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate,
    healthAssessmentTemplate
} from './emailTemplateService.js';


// =================================================================
// 1. TRANSPORTER SETUP
// =================================================================


const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: process.env.BREVO_SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

// Helper to format date cleanly for subject lines
const formatSubjectDate = (dateVal) => {
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return String(dateVal);
    }
};

// =================================================================
// 2. CORE SEND FUNCTION
// =================================================================

const sendEmail = async (recipient, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'HorizonFit <info@horizonfit.in>',
        to: recipient,
        subject: subject,
        text: text,
        html: html,
        headers: {
            'List-Unsubscribe': '<mailto:info@horizonfit.in?subject=unsubscribe>, <https://horizonfit.in/unsubscribe>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sent: ${subject} to ${recipient}`);
    } catch (error) {
        console.error(`[EMAIL] FAILED to send email to ${recipient}: ${error.message}`);
    }
};


// =================================================================
// 3. HIGH-LEVEL TEMPLATE FUNCTIONS
// =================================================================

/**
 * Sends a consultation booking confirmation.
 */
const sendConsultationBookingEmail = async ({ recipient, personName, otherPartyName, date, time, recipientRole, bookingId, mobileNumber, zoomLink }) => {
    const formattedDateStr = formatSubjectDate(date);
    const subject = `Your HorizonFit Consultation is Confirmed — ${formattedDateStr}`;
    const htmlBody = consultationBookingTemplate(personName, otherPartyName, date, time, recipientRole, bookingId, mobileNumber, zoomLink);
    const textBody = `Hello ${personName}, your consultation with ${otherPartyName} is confirmed for ${date} at ${time}. Booking ID: ${bookingId}${zoomLink ? `. Zoom link: ${zoomLink}` : ''}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a consultation update email (Status changes like Completed, Cancelled).
 */
const sendConsultationUpdateEmail = async ({ recipient, personName, otherPartyName, status, dateTime, zoomLink }) => {
    const formattedDateStr = formatSubjectDate(dateTime);
    const subject = status === 'Confirmed'
        ? `Your HorizonFit Consultation is Confirmed — ${formattedDateStr}`
        : `Update: Consultation is ${status} — ${formattedDateStr}`;
    const htmlBody = consultationUpdateTemplate(personName, otherPartyName, status, dateTime, zoomLink);
    const textBody = `Hello ${personName}, your consultation status with ${otherPartyName} has been updated to ${status}.${zoomLink ? ` Zoom link: ${zoomLink}` : ''}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a password reset email.
 */
const sendPasswordResetEmail = async (recipient, userName, resetLink) => {
    const subject = 'Password Reset Request - HorizonFit';
    const htmlBody = passwordResetTemplate(userName, resetLink);
    const textBody = `Hello ${userName}, use this link to reset your password: ${resetLink}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a welcome email to a new patient.
 */
const sendPatientWelcomeEmail = async (recipient, patientName, assignedDoctorName, password) => {
    const subject = 'Welcome to HorizonFit - Your Account is Ready';
    const htmlBody = patientWelcomeTemplate(patientName, assignedDoctorName, recipient, password);
    const textBody = `Welcome ${patientName}! Your HorizonFit account is created. Login with ${recipient} and temporary password: ${password}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a program booking confirmation.
 */
const sendProgramBookingEmail = async (recipient, patientName, specialistName, startDate, paymentId, price, planTier, email = null, password = null, bookingId = null) => {
    const subject = `Enrollment Confirmed: 15-Week Transformation`;
    const htmlBody = programBookingTemplate(patientName, specialistName, startDate, planTier, paymentId, email, password, bookingId);
    const textBody = `Hello ${patientName}, your enrollment in the ${planTier} plan is confirmed for ${startDate}. Booking ID: ${bookingId || 'N/A'}, Payment ID: ${paymentId}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a task assignment notification.
 */
const sendTaskAssignmentEmail = async (recipient, personName, otherPartyName, taskName, dueDate, taskDescription) => {
    const subject = `New Task: ${taskName}`;
    const htmlBody = taskAssignmentTemplate(personName, otherPartyName, taskName, dueDate, taskDescription);
    const textBody = `Hello ${personName}, a new task "${taskName}" has been assigned. Due: ${dueDate}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

const buildHealthAssessmentEmail = ({ recipient, formData, filename, pdfBuffer, reportUrl }) => ({
    from: process.env.EMAIL_FROM || 'HorizonFit <info@horizonfit.in>',
    to: recipient,
    subject: 'New Horizon Fit Health Assessment Submission',
    text: `A new health assessment was submitted by ${formData.fullName} (${formData.email}). The report is attached as ${filename}. Respondent report link: ${reportUrl}`,
    html: healthAssessmentTemplate(formData, filename, reportUrl),
    attachments: [{
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
    }],
});

const sendHealthAssessmentEmail = async ({ formData, filename, pdfBuffer, reportUrl }) => {
    // const recipient = process.env.HEALTH_ASSESSMENT_RECIPIENT || 'info@horizonfit.in';
    const recipient = 'info@horizonfit.in';
    const escapeEmailHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
    const deliveries = await Promise.allSettled([
        transporter.sendMail(buildHealthAssessmentEmail({ recipient, formData, filename, pdfBuffer, reportUrl })),
        transporter.sendMail({
            from: process.env.EMAIL_FROM || 'HorizonFit <info@horizonfit.in>',
            to: formData.email,
            subject: 'Your HorizonFit Health Insight Report is ready',
            text: `Hello ${formData.fullName}, your Health Insight Report is ready. Open your saved report: ${reportUrl}`,
            html: `<p>Hello ${escapeEmailHtml(formData.fullName)},</p><p>Your HorizonFit Health Insight Report is ready.</p><p><a href="${escapeEmailHtml(reportUrl)}">Open your saved report</a></p>`,
        }),
    ]);

    const [clinicDelivery, respondentDelivery] = deliveries;
    if (clinicDelivery.status === 'fulfilled') {
        console.log(`[EMAIL] Health assessment sent to ${recipient}`);
    } else {
        console.error(`[EMAIL] Failed to send assessment to clinical inbox: ${clinicDelivery.reason.message}`);
    }
    if (respondentDelivery.status === 'fulfilled') {
        console.log('[EMAIL] Saved report link sent to respondent');
    } else {
        console.error(`[EMAIL] Failed to send saved report link to respondent: ${respondentDelivery.reason.message}`);
    }

    return {
        recipient,
        clinicEmailSent: clinicDelivery.status === 'fulfilled',
        reportLinkSent: respondentDelivery.status === 'fulfilled',
    };
};


export {
    sendEmail,
    sendConsultationBookingEmail,
    sendConsultationUpdateEmail,
    sendPasswordResetEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail,
    sendProgramBookingEmail,
    buildHealthAssessmentEmail,
    sendHealthAssessmentEmail
};