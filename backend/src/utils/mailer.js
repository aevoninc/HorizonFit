// NOTE: In a real Node.js environment, you would run 'npm install nodemailer' 
// and uncomment the import below.
import nodemailer from 'nodemailer'; // **CORRECTION: Use the real import**
// Import the template generation functions from the template service
import dotenv from "dotenv";

dotenv.config();
import { consultationUpdateTemplate, passwordResetTemplate } from './emailTemplateService.js'; 

// **REMOVED: The mockNodemailer object is removed to use the real setup.**

// =================================================================
// 1. TRANSPORTER SETUP (Uses SendGrid via SMTP Configuration)
// =================================================================

// **CORRECTION: This is now the active transporter setup for SendGrid.**

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
        console.log("BREVO USER:", process.env.BREVO_SMTP_USER);
        console.log("BREVO KEY:", process.env.BREVO_SMTP_KEY ? "LOADED" : "NOT LOADED");
        console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
        await transporter.sendMail(mailOptions);
        console.log("Email transporter configured with Brevo SMTP.",transporter.options.auth); 
        console.log(`[EMAIL] Successfully triggered mail for ${recipient}.`);
        
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
    
    // **CORRECTION: Fixed missing 'subject' variable and simplified logic**
    // The previous logic depended on a missing 'isPatient' flag, so we'll use a generic subject.
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


export { 
    sendEmail, 
    sendConsultationUpdateEmail, 
    sendPasswordResetEmail,
};