import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

import { 
    consultationUpdateTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate
} from './emailTemplateService.js'; 


// =================================================================
// 1. TRANSPORTER SETUP (Uses SendGrid via SMTP Configuration)
// =================================================================


const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

// =================================================================
// 2. CORE SEND FUNCTION
// =================================================================

/**
 * Sends an email using the configured transporter.
 * @param {string} recipient - The email address of the recipient.
 * @param {string} subject - The subject line.
 * @param {string} text - The plain text body.
 * @param {string} html - The HTML body.
 * @returns {Promise<void>}
 */

const sendEmail = async (recipient, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Health App <no-reply@aevon.in>',
        to: recipient,
        subject: subject,
        text: text,
        html: html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sent to ${recipient}: ${info.messageId}`);
    } catch (error) {
        console.log("Error details:", error);
        console.error(`[EMAIL] FAILED to send email to ${recipient}: ${error.message}`);
    }
};


// =================================================================
// 3. HIGH-LEVEL TEMPLATE FUNCTIONS (For Controller Use)
// =================================================================

/**
 * Sends a consultation update email (Confirmed, Rescheduled, Cancelled).
 */
const sendConsultationUpdateEmail = async (recipient, personName, otherPartyName, status, dateTime) => {
    
    const subject = `${status} Consultation with ${otherPartyName}`;
    
    const htmlBody = consultationUpdateTemplate(personName, otherPartyName, status, dateTime);
    const textBody = `Hello ${personName}, your consultation status with ${otherPartyName} is ${status} for ${dateTime}. Please check your dashboard.`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a password reset email using the pre-defined template.
 */
const sendPasswordResetEmail = async (recipient, userName, resetLink) => {
    const subject = 'Password Reset Request';
    const htmlBody = passwordResetTemplate(userName, resetLink);
    const textBody = `Hello ${userName}, click the following link to reset your password: ${resetLink}`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a welcome email to a new patient.
 */
const sendPatientWelcomeEmail = async (recipient, patientName, assignedDoctorName) => {
    const subject = 'Welcome to Aevon Health - Your Health Journey Starts Now!';
    const htmlBody = patientWelcomeTemplate(patientName, assignedDoctorName);
    const textBody = `Welcome ${patientName}! Your account is created, and your specialist is ${assignedDoctorName}. Log in to get started.`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a notification to the patient (or doctor) about a newly assigned task.
 */
const sendTaskAssignmentEmail = async (recipient, personName, otherPartyName, taskName, dueDate, taskDescription) => {
    const isDoctor = personName.startsWith('Dr.');
    let subject;
    
    if (isDoctor) {
        subject = `Task Confirmation: ${taskName} assigned to Patient ${otherPartyName}`;
    } else {
        subject = `ACTION REQUIRED: New Care Task Assigned - ${taskName}`;
    }

    const htmlBody = taskAssignmentTemplate(personName, otherPartyName, taskName, dueDate, taskDescription);
    const textBody = `Hello ${personName}, a new task "${taskName}" with a due date of ${dueDate} has been assigned. Please check your dashboard for details.`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends confirmation to both the patient and the doctor for the 15-Week Program booking.
 */
const sendProgramBookingEmail = async (recipient, personName, otherPartyName, startDate, paymentId) => {
    const programName = '15-Week Wellness Program';
    const isDoctor = personName.startsWith('Dr.');
    let subject;

    if (isDoctor) {
        subject = `NEW ENROLLMENT: ${programName} - Patient ${otherPartyName}`;
    } else {
        subject = `CONFIRMATION: Your ${programName} Enrollment is Complete!`;
    }

    const htmlBody = programBookingTemplate(personName, otherPartyName, startDate, paymentId);
    const textBody = `Hello ${personName}, your enrollment in the ${programName} is confirmed (Start Date: ${startDate}). Please check your dashboard.`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};


export { 
    sendEmail, 
    sendConsultationUpdateEmail, 
    sendPasswordResetEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail,
    sendProgramBookingEmail 
};