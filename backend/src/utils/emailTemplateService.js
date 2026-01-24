// NOTE: We use template literals (backticks) to build the HTML and inject dynamic data.

// =================================================================
// 0. BASE TEMPLATE (Provided by user - Used for consistent styling)
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


// =================================================================
// 1. CONSULTATION UPDATE TEMPLATE (User's Existing Function)
// =================================================================

const consultationUpdateTemplate = (recipientName, otherPartyName, status, dateTime, bookingId) => {
    let title = '';
    let message = '';
    let statusClass = 'status-box'; 

    const isDoctor = recipientName?.startsWith('Dr.'); 
    // You can now use bookingId in the link if needed, e.g., for direct tracking
    const link = `https://dashboard.aevon.in/my-appointments/${bookingId || ''}`;

    // Safely format the date
    const formattedDate = dateTime ? new Date(dateTime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) : 'TBD';

    // Handle status logic
    if (status === 'Confirmed') {
        statusClass = 'status-confirmed';
        title = 'Appointment Confirmed';
        message = isDoctor 
            ? `<p>Dear ${recipientName},</p><p>A new consultation has been added to your schedule.</p><p><strong>Patient:</strong> ${otherPartyName}</p><p><strong>Time:</strong> ${formattedDate}</p>`
            : `<p>Dear ${recipientName},</p><p>Your consultation is now <strong>CONFIRMED</strong> with <strong>${otherPartyName}</strong>.</p><p><strong>Date/Time:</strong> ${formattedDate}</p>`;

    } else if (status === 'Rescheduled') {
        statusClass = 'status-rescheduled';
        title = 'Appointment Rescheduled';
        message = `<p>Dear ${recipientName},</p>
                   <p>Please note that your appointment with <strong>${otherPartyName}</strong> has been <strong>RESCHEDULED</strong>.</p>
                   <p><strong>New Date/Time:</strong> ${formattedDate}</p>
                   <p>If this new time does not work for you, please contact support or update via your dashboard.</p>`;

    } else if (status === 'Cancelled') {
        statusClass = 'status-cancelled';
        title = 'Appointment Cancelled';
        message = isDoctor
            ? `<p>Dear ${recipientName},</p><p>The appointment with <strong>${otherPartyName}</strong> on ${formattedDate} has been <strong>CANCELLED</strong>.</p>`
            : `<p>Dear ${recipientName},</p><p>Your consultation with <strong>${otherPartyName}</strong> on ${formattedDate} has been <strong>CANCELLED</strong>.</p><p>Refunds are processed within 5-10 business days.</p>`;

    } else {
        title = `Appointment ${status}`;
        message = `<p>Dear ${recipientName}, your appointment with ${otherPartyName} is now <strong>${status}</strong>.</p>
                   <p><strong>Scheduled for:</strong> ${formattedDate}</p>`;
    }

    const content = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <div class="${statusClass}" style="padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #14b8a6; background-color: #f0fdfa;">
                <h2 style="margin: 0; color: #0f766e;">${title}</h2>
            </div>
            ${message}
            <p style="font-size: 12px; color: #666; margin-top: 15px;">Reference ID: ${bookingId || 'N/A'}</p>
            <p style="margin-top: 20px;">Thank you for using Aevon Health.</p>
        </div>
    `;

    return renderBaseTemplate(title, content, link, 'View Appointment Details');
};


// =================================================================
// 2. PASSWORD RESET TEMPLATE (User's Existing Function)
// =================================================================

const passwordResetTemplate = (userName, resetLink) => {
    const title = 'Password Reset Request';
    const content = `
        <p>Hello ${userName},</p>
        <p>You recently requested to reset your password for your Aevon.in account. Click the button below to complete the process.</p>
        
        <p style="color: #dc3545; font-weight: bold;">This link will expire in 60 minutes for security purposes.</p>
        
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `;

    return renderBaseTemplate(title, content, resetLink, 'Reset My Password');
};

// =================================================================
// 3. NEW: PATIENT WELCOME TEMPLATE
// =================================================================

const patientWelcomeTemplate = (patientName, assignedDoctorName, email, password) => {
    const title = 'Welcome to HorizonFit!';
    const link = 'https://horizonfit.in/#/login'; // Link specifically to login page
    
    const content = `
        <p>Dear ${patientName},</p>
        <div class="status-confirmed">
            <h3>Welcome Aboard!</h3>
        </div>
        <p>Your account with Aevon Health has been successfully created.</p>
        
        <div style="background-color: #f8f9fa; border: 1px dashed #007bff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #007bff;">Your Login Credentials:</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>

        <p style="color: #dc3545; font-size: 0.9em; font-weight: bold;">
            ⚠️ Security Note: Please change your password immediately after your first login for your privacy and security.
        </p>
        
        <p>Your primary care specialist: <strong>${assignedDoctorName}</strong></p>
        
        <p>Click the button below to log in and access your personalized health program.</p>
    `;

    return renderBaseTemplate(title, content, link, 'Login to My Account');
};



const taskAssignmentTemplate = (recipientName, otherPartyName, taskName, dueDate, taskDescription) => {
    const link = 'https://horizonfit.in/#'; // Link to tasks page
    const isDoctor = recipientName.startsWith('Dr.');
    const title = isDoctor ? 'Patient Task Assigned' : 'New Task Assigned to You';
    
    let message = '';

    if (isDoctor) {
        // Recipient is the Doctor
        message = `
            <p>Dear ${recipientName},</p>
            <p>You have successfully assigned a new task to your patient, **${otherPartyName}**.</p>
            <div class="status-box">
                <p style="margin: 5px 0;"><strong>Task:</strong> ${taskName}</p>
                <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p>Please monitor their progress in the patient's record on your dashboard.</p>
            <p><strong>Description:</strong> ${taskDescription}</p>
        `;
    } else {
        // Recipient is the Patient
        message = `
            <p>Dear ${recipientName},</p>
            <p>**${otherPartyName}** has assigned a new task to your personalized health program.</p>
            <div class="status-box">
                <p style="margin: 5px 0; font-size: 1.1em;"><strong>NEW TASK:</strong> ${taskName}</p>
                <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p>Please complete this task by the due date to ensure continuous progress in your care plan.</p>
            <p><strong>Details:</strong> ${taskDescription}</p>
        `;
    }

    const content = `
        <p>Hello ${recipientName},</p>
        ${message}
        <p>Thank you for participating in your care program.</p>
    `;

    return renderBaseTemplate(title, content, link, 'View All Tasks');
};


const programBookingTemplate = (recipientName, otherPartyName, startDate, paymentId, price, planTier) => {
    const programName = '15-Week Wellness Program';
    const link = 'https://horizonfit.in/#';
    const isDoctor = recipientName.startsWith('Dr.');
    
    // Format price as currency
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(price);

    let title = isDoctor ? `New Enrollment: ${otherPartyName}` : `Welcome to the ${programName}!`;
    let message = '';

    if (isDoctor) {
        message = `
            <p>Dear ${recipientName},</p>
            <p>A new patient has successfully enrolled in your program.</p>
            <div class="status-box">
                <p style="margin: 5px 0;"><strong>Patient:</strong> ${otherPartyName}</p>
                <p style="margin: 5px 0;"><strong>Plan Tier:</strong> ${planTier.toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${formattedPrice}</p>
                <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            </div>
            <p>Please review the patient's profile to begin their journey.</p>
        `;
    } else {
        message = `
            <p>Dear ${recipientName},</p>
            <p>Your enrollment in the <strong>${programName}</strong> is now confirmed!</p>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #155724;">Payment Successful</h3>
                <p style="margin: 5px 0; color: #155724;">Amount: ${formattedPrice} (${planTier.toUpperCase()} Plan)</p>
            </div>

            <ul style="list-style: none; padding-left: 0; line-height: 2;">
                <li><strong>Your Specialist:</strong> ${otherPartyName}</li>
                <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
                <li><strong>Transaction ID:</strong> ${paymentId}</li>
            </ul>
        `;
    }
    
    const content = `
        ${message}
        <p>We are excited to help you achieve your health goals!</p>
    `;

    return renderBaseTemplate(title, content, link, isDoctor ? 'Open Doctor Dashboard' : 'Go to My Program');
};

export {
    consultationUpdateTemplate,
    passwordResetTemplate,
    patientWelcomeTemplate,
    taskAssignmentTemplate,
    programBookingTemplate
};