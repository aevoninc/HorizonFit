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
    } catch (error) {
        console.error(`[EMAIL] FAILED to send email to ${recipient}: ${error.message}`);
    }
};


// =================================================================
// 3. HIGH-LEVEL TEMPLATE FUNCTIONS (For Controller Use)
// =================================================================

/**
 * Sends a consultation update email (Confirmed, Rescheduled, Cancelled).
 */
// Fixed sendConsultationUpdateEmail in mailer.js
const sendConsultationUpdateEmail = async ({ recipient, personName, doctor, status, dateTime, bookingId }) => {
    
    const subject = `${status} Consultation with ${doctor}`;
    
    // We pass the parameters to the template. 
    // Note: Added bookingId as the 5th argument.
    const htmlBody = consultationUpdateTemplate(personName, doctor, status, dateTime, bookingId);
    
    const textBody = `Hello ${personName}, your consultation status with ${doctor} is ${status} for ${dateTime}. Please check your dashboard.`;

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
/**
 * Sends a welcome email to a new patient including login credentials.
 */
const sendPatientWelcomeEmail = async (recipient, patientName, assignedDoctorName, password) => {
    const subject = 'Your Aevon Health Account Credentials';
    
    // We pass recipient as the 'email' field to the template
    const htmlBody = patientWelcomeTemplate(patientName, assignedDoctorName, recipient, password);
    
    const textBody = `Welcome ${patientName}! 
    Your account is created. 
    Login Email: ${recipient}
    Temporary Password: ${password}
    Your specialist is ${assignedDoctorName}. Log in at https://horizonfit.in to get started.`;

    await sendEmail(recipient, subject, textBody, htmlBody);
};

/**
 * Sends a notification to the patient (or doctor) about a newly assigned task.
 */
const sendTaskAssignmentEmail = async (recipient, personName,password,otherPartyName, taskName, dueDate, taskDescription) => {
    const nameToTest = personName || ""; 
    const isDoctor = nameToTest.startsWith('Dr.');
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
const sendProgramBookingEmail = async (recipient, personName, otherPartyName, startDate, paymentId, price, planTier) => {
    const programName = '15-Week Wellness Program';
    const isDoctor = personName.startsWith('Dr.');
    
    const subject = isDoctor 
        ? `[NEW ENROLLMENT] ${otherPartyName} - ${planTier.toUpperCase()}`
        : `Confirmation: Your ${programName} Enrollment`;

    // Passing all arguments to the updated template
    const htmlBody = programBookingTemplate(personName, otherPartyName, startDate, paymentId, price, planTier);
    const textBody = `Hello ${personName}, your enrollment is confirmed. Plan: ${planTier}, Price: ${price}. Start Date: ${startDate}.`;

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