import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

import {
    consultationUpdateTemplate,
    consultationBookingTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate
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

// =================================================================
// 2. CORE SEND FUNCTION
// =================================================================

const sendEmail = async (recipient, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'HorizonFit <no-reply@aevon.in>',
        to: recipient,
        subject: subject,
        text: text,
        html: html,
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
const sendConsultationBookingEmail = async ({ recipient, personName, otherPartyName, date, time, recipientRole, bookingId, mobileNumber }) => {
    const subject = `Your HorizonFit Consultation Details - ${date}`;
    const htmlBody = consultationBookingTemplate(personName, otherPartyName, date, time, recipientRole, bookingId, mobileNumber);
    const textBody = `Hello ${personName}, your consultation with ${otherPartyName} is confirmed for ${date} at ${time}. Booking ID: ${bookingId}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a consultation update email (Status changes like Completed, Cancelled).
 */
const sendConsultationUpdateEmail = async ({ recipient, personName, otherPartyName, status, dateTime }) => {
    const subject = `Update: Consultation is ${status}`;
    const htmlBody = consultationUpdateTemplate(personName, otherPartyName, status, dateTime);
    const textBody = `Hello ${personName}, your consultation status with ${otherPartyName} has been updated to ${status}.`;

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
const sendProgramBookingEmail = async (recipient, patientName, specialistName, startDate, paymentId, price, planTier) => {
    const subject = `Enrollment Confirmed: 15-Week Transformation`;
    const htmlBody = programBookingTemplate(patientName, specialistName, startDate, planTier, paymentId);
    const textBody = `Hello ${patientName}, your enrollment in the ${planTier} plan is confirmed for ${startDate}. Payment ID: ${paymentId}`;

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


export {
    sendEmail,
    sendConsultationBookingEmail,
    sendConsultationUpdateEmail,
    sendPasswordResetEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail,
    sendProgramBookingEmail
};