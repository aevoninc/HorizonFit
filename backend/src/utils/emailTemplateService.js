// NOTE: We use template literals (backticks) to build the HTML and inject dynamic data.

// =================================================================
// 1. CONSULTATION UPDATE TEMPLATE
// =================================================================

/**
 * A simplified base function to wrap the dynamic content in a styled, responsive HTML structure.
 * NOTE: In a real environment, this would be a sophisticated template system using tools 
 * like Handlebars or EJS, and the CSS would be fully inlined.
 */
const renderBaseTemplate = (title, content, link, buttonText) => {
    // Basic inline styling for maximum email client compatibility
    const style = `
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333333;
    `;
    const containerStyle = `
        max-width: 600px; 
        margin: 20px auto; 
        padding: 20px; 
        border: 1px solid #dddddd; 
        border-radius: 8px;
        background-color: #ffffff;
    `;
    const headerStyle = `
        background-color: #007bff; 
        color: white; 
        padding: 15px; 
        text-align: center; 
        border-top-left-radius: 8px; 
        border-top-right-radius: 8px;
    `;
    const buttonStyle = `
        display: inline-block; 
        padding: 10px 20px; 
        margin: 20px 0; 
        background-color: #28a745; 
        color: white; 
        text-decoration: none; 
        border-radius: 5px;
    `;
    const footerStyle = `
        margin-top: 20px; 
        padding-top: 10px; 
        border-top: 1px solid #eeeeee; 
        font-size: 0.8em; 
        text-align: center; 
        color: #777777;
    `;
    const statusConfirmedStyle = `
        background-color: #d4edda; 
        color: #155724; 
        padding: 10px; 
        border-radius: 4px; 
        font-weight: bold; 
        margin-bottom: 15px;
    `;
    const statusCancelledStyle = `
        background-color: #f8d7da; 
        color: #721c24; 
        padding: 10px; 
        border-radius: 4px; 
        font-weight: bold; 
        margin-bottom: 15px;
    `;
    const statusBoxStyle = `
        background-color: #cce5ff; 
        color: #004085; 
        padding: 10px; 
        border-radius: 4px; 
        font-weight: bold; 
        margin-bottom: 15px;
    `;
    
    // Replace the placeholder status classes with the inline styles above
    const contentWithStyles = content
        .replace('class="status-confirmed"', `style="${statusConfirmedStyle}"`)
        .replace('class="status-cancelled"', `style="${statusCancelledStyle}"`)
        .replace('class="status-box"', `style="${statusBoxStyle}"`);

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body style="${style} background-color: #f4f4f4;">
            <div style="${containerStyle}">
                <div style="${headerStyle}">
                    <h2>Aevon Health App</h2>
                </div>
                
                <div style="padding: 20px 0;">
                    ${contentWithStyles}
                </div>
                
                <div style="text-align: center;">
                    <a href="${link}" style="${buttonStyle}">${buttonText}</a>
                </div>

                <div style="${footerStyle}">
                    <p>This is an automated notification. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} Aevon Health</p>
                </div>
            </div>
        </body>
        </html>
    `;
};


const consultationUpdateTemplate = (recipientName, otherPartyName, status, dateTime) => {
    let title = '';
    let message = '';
    let statusClass = ''; // Used as a placeholder to be replaced by renderBaseTemplate

    // Use proper checking: if the other party is the doctor, the recipient is the patient.
    // The previous heuristic 'isDoctor' was checking the recipient, which is fine, 
    // but we need to ensure the logic flows correctly for the dynamic content.
    const isDoctor = recipientName.startsWith('Dr.'); 
    const link = 'https://dashboard.aevon.in/my-appointments'; // Example dashboard link

    // --- Dynamic Content based on Status and Recipient Type ---

    if (status === 'Confirmed') {
        statusClass = 'status-confirmed';
        title = 'Appointment Confirmed';

        if (isDoctor) {
            // Recipient is the Doctor
            message = `
                <p>Dear ${recipientName},</p>
                <p>This email confirms a **new consultation booking** has been added to your schedule.</p>
                <p><strong>Patient:</strong> ${otherPartyName}</p>
                <p><strong>Time:</strong> ${dateTime}</p>
                <p>Please review the patient's submitted query and ensure your virtual office is ready for the meeting.</p>
            `;
        } else {
            // Recipient is the Patient
            message = `
                <p>Dear ${recipientName},</p>
                <p>Your consultation booking is now **CONFIRMED**.</p>
                <p>We look forward to connecting you with **${otherPartyName}** for your scheduled session.</p>
                <p><strong>Appointment Date/Time:</strong> ${dateTime}</p>
            `;
        }

    } else if (status === 'Cancelled') {
        statusClass = 'status-cancelled';
        title = 'Appointment Cancelled';

        if (isDoctor) {
            // Recipient is the Doctor
            message = `
                <p>Dear ${recipientName},</p>
                <p>Please note that the following appointment has been **CANCELLED**.</p>
                <p><strong>Patient:</strong> ${otherPartyName}</p>
                <p><strong>Original Time:</strong> ${dateTime}</p>
                <p>Your schedule has been updated to reflect this change.</p>
            `;
        } else {
            // Recipient is the Patient
            message = `
                <p>Dear ${recipientName},</p>
                <p>Your consultation with **${otherPartyName}** on ${dateTime} has been **CANCELLED**.</p>
                <p>If applicable, any refund will be processed according to our policy within 5-10 business days.</p>
            `;
        }

    } else {
        // Handle other statuses like 'Rescheduled' or 'Pending'
        title = `Appointment ${status}`;
        statusClass = 'status-box'; // Generic class
        message = `<p>Dear ${recipientName}, the status of your appointment with ${otherPartyName} has been updated to **${status}**.</p><p>Please check your dashboard for details.</p>`;
    }


    const content = `
        <p>Hello ${recipientName},</p>
        <div class="${statusClass}">
            <h3>${title}</h3>
        </div>
        ${message}
        <p>Thank you for using Aevon Health App.</p>
    `;

    return renderBaseTemplate(title, content, link, 'View Appointment Details');
};


// =================================================================
// 2. PASSWORD RESET TEMPLATE
// =================================================================

/**
 * Generates the content for a password reset request.
 * @param {string} userName - The name of the user.
 * @param {string} resetLink - The secure link to reset the password.
 * @returns {string} The complete HTML email body.
 */
const passwordResetTemplate = (userName, resetLink) => {
    const title = 'Password Reset Request';
    const content = `
        <p>Hello ${userName},</p>
        <p>You recently requested to reset your password for your Aevon.in account. Click the button below to complete the process.</p>
        
        <p style="color: #dc3545; font-weight: bold;">This link will expire in 60 minutes for security purposes.</p>
        
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `;

    // Use the base template to wrap the content and include the action button
    return renderBaseTemplate(title, content, resetLink, 'Reset My Password');
};


export {
    consultationUpdateTemplate,
    passwordResetTemplate
};