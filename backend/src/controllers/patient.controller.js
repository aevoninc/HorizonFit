// controllers/patientController.js
import asyncHandler from '../utils/asyncHandler.js';
import PatientTrackingData from '../model/patientTrackingData.model.js'; 
import User from '../model/user.model.js';  
import PatientProgramTask from '../model/patientProgramTask.model.js'; 
import PatientTaskLog from '../model/patientTaskLog.model.js';
import ConsultationBooking from '../model/consultationBooking.model.js';
import programBookingModel from '../model/programBooking.model.js';
import {
    processPayment,
    processRefund,
    createRazorpayOrder
} from '../utils/payment.js';
import {
    sendConsultationUpdateEmail, 
    sendPasswordResetEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail,
    sendProgramBookingEmail 
} from '../utils/mailer.js';
import crypto from 'crypto';
import {
    DOCTOR_EMAIL,
    DOCTOR_NAME,
    ADMIN_MAIL,
    CONSULTANCY_BOOKING_PRICE,
    PROGRAM_BOOKING_PRICE
} from '../constants.js';

const checkZoneCompletion = async (patientId, zone) => {
    // 1. Find all unique tasks that belong to the previous zone (N-1)
    const requiredTasks = await PatientProgramTask.find({
        patientId: patientId,
        zone: zone
    }).select('_id').lean();

    // If there are no required tasks in the zone, we assume the zone is completed (this shouldn't happen in a well-defined program)
    if (requiredTasks.length === 0) {
        return true; 
    }

    const requiredTaskIds = requiredTasks.map(task => task._id);

    // 2. Count how many of these tasks have been logged as completed by the patient
    // Note: Since PatientTaskLog schema is simple, we just count unique task IDs logged.
    const loggedCompletions = await PatientTaskLog.find({
        patientId: patientId,
        taskId: { $in: requiredTaskIds }
    })
    // We only care about unique tasks logged, so we count the number of distinct task IDs
    .distinct('taskId');
    
    // Check if the number of distinct tasks logged equals the total number of required tasks
    return loggedCompletions.length === requiredTaskIds.length;
};
const findCurrentHighestCompletedZone = async (patientId) => {
    // Start checking from Zone 5 backwards to find the highest completed one.
    for (let zone = 5; zone >= 1; zone--) {
        if (await checkZoneCompletion(patientId, zone)) {
            return zone;
        }
    }
    return 0; // If Zone 1 is not completed, return 0
};
// Function to calculate the current week number
const calculateProgramWeek = (programStartDate, dateRecorded) => {
    const start = new Date(programStartDate);
    const recorded = new Date(dateRecorded);

    // 1. Calculate the difference in milliseconds
    // Note: We use Math.max to handle potential backdating, ensuring the result is non-negative
    const timeDifference = Math.max(0, recorded.getTime() - start.getTime());
    
    // 2. Convert the difference from milliseconds to days
    // (1000 ms/s * 60 s/min * 60 min/hr * 24 hr/day)
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // 3. Convert days to weeks and add 1 (since the first week is Week 1, not Week 0)
    // Math.floor ensures we only count full weeks passed.
    const weekNumber = Math.floor(daysDifference / 7) + 1;
    
    // 4. Cap the week number at the maximum program length (15 weeks)
    return Math.min(weekNumber, 15);
};


// @desc    Patient submits a health metric (e.g., weight, blood sugar)
// @route   POST /api/patient/log-metric
// @access  Private/Patient
const logTrackingData = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const { type, value, unit, recordDate } = req.body;
    // Optional: Basic validation to ensure all required data is present
    if (!type || value === undefined || !unit) {
        return res.status(400).json({ message: 'Missing required tracking data fields (type, value, unit).' });
    }
    
    // Fetch the patient's program start date to calculate the accurate weekNumber if not provided
    const patient = await User.findById(patientId).select('programStartDate isActive');
    console.log(patient);
    if (!patient || !patient.isActive) {
         return res.status(401).json({ message: 'Account is inactive or not found.' });
    }
    // Function to calculate the program week number based on start date and record date
  const calculatedWeekNumber = calculateProgramWeek(patient.programStartDate, recordDate);

    // 3. Create the tracking record
    const trackingRecord = await PatientTrackingData.create({
        patientId,
        type,
        value,
        unit,
        dateRecorded: recordDate, 
        weekNumber: calculatedWeekNumber // <-- Use the calculated value
    });

    res.status(201).json({ 
        message: `${type} metric logged successfully for Week ${calculatedWeekNumber}.`, 
        record: trackingRecord 
    });
});


// @desc    Patient logs a specific program task as complete
// @route   POST /api/patient/log-task/:taskId
// @access  Private/Patient
const logTaskCompletion = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const { taskId } = req.params;
    const { completionDate } = req.body; // Allows patient to backdate logs if necessary

    // 1. Find the Master Task to ensure it exists and belongs to the patient
    const masterTask = await PatientProgramTask.findOne({ 
        _id: taskId, 
        patientId: patientId 
    });

    if (!masterTask) {
        return res.status(404).json({ message: 'Assigned task not found or does not belong to this patient.' });
    }
    
    // 2. Prevent duplicate logging for Daily/SpecificDays tasks on the same day
    const dateToLog = completionDate ? new Date(completionDate) : new Date();
    dateToLog.setHours(0, 0, 0, 0); // Normalize to start of day for check

    const existingLog = await PatientTaskLog.findOne({
        taskId: taskId,
        completionDate: {
            $gte: dateToLog, // Start of the day
            $lt: new Date(dateToLog.getTime() + 24 * 60 * 60 * 1000) // End of the day
        }
    });

    if (existingLog && (masterTask.frequency === 'Daily' || masterTask.frequency === 'SpecificDays')) {
        return res.status(409).json({ message: 'Task already logged as complete for this day.' });
    }

    // 3. Create the Compliance Log
    const newLog = await PatientTaskLog.create({
        patientId,
        taskId,
        completionDate: completionDate || new Date()
    });
    
    
    // 4. Update the Master Task Status for ONE-TIME/WEEKLY tasks (as discussed before)
    if (masterTask.frequency === 'Weekly' || masterTask.frequency === 'OneTime') {
        if (masterTask.status !== 'Completed') {
            masterTask.status = 'Completed';
            masterTask.completionDate = new Date();
            await masterTask.save();
        }
    }

    // Daily/SpecificDays tasks status remains pending until the end-of-week cron job runs
    res.status(201).json({ 
        message: `Task logged successfully. Good job on "${masterTask.description}"!`, 
        log: newLog 
    });
});


// @desc    Get Patient's Program Tasks for Today with Compliance Status
// @route   GET /api/patient/tasks/today
// @access  Private/Patient
const getPatientTasks = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    
    // --- 1. Determine the Current Day ---
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayIndex = new Date().getDay();
    const currentDay = dayNames[currentDayIndex]; 
    
    // Define the start and end of TODAY for the compliance check
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // --- 2. Fetch Master Tasks Applicable TODAY ---
    const applicableTasks = await PatientProgramTask.find({ 
        patientId: patientId, 
        status: { $in: ['Pending', 'Rescheduled'] }, // Only show tasks that aren't finished
        $or: [
            { frequency: 'Daily' },                         // Show Daily tasks
            { frequency: 'Weekly' },                        // Show Weekly tasks
            { frequency: 'OneTime', status: 'Pending' },    // Show pending OneTime tasks
            { daysApplicable: currentDay },                 // Show tasks specific to today
        ]
    }).sort({ programWeek: 1, createdAt: 1 });
    
    if (applicableTasks.length === 0) {
        return res.status(200).json({ message: 'No active tasks found for today.', tasks: [] });
    }

    // --- 3. Check Compliance for Applicable Tasks ---
    // Fetch all relevant logs for the patient for TODAY
    const todayLogs = await PatientTaskLog.find({
        patientId: patientId,
        completionDate: { $gte: startOfToday, $lt: endOfToday }
    }).select('taskId');
    
    // Convert logs into a set for fast lookup
    const completedTaskIdsToday = new Set(todayLogs.map(log => log.taskId.toString()));

    // --- 4. Annotate Tasks with Completion Status ---
    const tasksWithStatus = applicableTasks.map(task => {
        const taskIdStr = task._id.toString();
        const isCompletedToday = completedTaskIdsToday.has(taskIdStr);
        
        // Daily/SpecificDays tasks should be marked completed today if logged
        if (task.frequency === 'Daily' || task.frequency === 'SpecificDays') {
            return {
                ...task.toObject(),
                isCompletedToday: isCompletedToday 
            };
        }
        
        // Weekly/OneTime tasks are generally marked completed via the status field, but we can confirm the log exists
        return {
            ...task.toObject(),
            isCompletedToday: isCompletedToday // Useful if the log was just submitted
        };
    });

    res.status(200).json({ tasks: tasksWithStatus });
});

// @desc    Patient retrieves their complete program history, logs, and health metrics
// @route   GET /api/patient/progress
// @access  Private/Patient
const getPatientProgress = asyncHandler(async (req, res) => {
    const patientId = req.user._id;

    // 1. Fetch all Master Tasks assigned to the patient (The whole plan)
    const masterTasks = await PatientProgramTask.find({ patientId })
        .sort({ programWeek: 1, createdAt: 1 })
        .select('-patientId -updatedAt');

    // 2. Fetch all Compliance Logs (Proof of action history)
    const taskLogs = await PatientTaskLog.find({ patientId })
        .sort({ completionDate: 1 })
        .select('taskId completionDate'); // Only need the link and the date

    // 3. Fetch all Objective Health Metrics (Weight, Blood Sugar, etc.)
    const trackingData = await PatientTrackingData.find({ patientId })
        .sort({ dateRecorded: 1 })
        .select('type value unit dateRecorded weekNumber');
        
    // NOTE: The frontend will use these three datasets to calculate compliance percentages
    // and generate trend charts.

    res.status(200).json({
        message: 'Patient progress data retrieved successfully.',
        masterTasks,
        taskLogs,
        trackingData
    });
});

// @desc    Patient requests a consultation after choosing a specific date/time via Calendly
// @route   POST /api/patient/consultation-request
// @access  Private/Patient
const requestConsultation = asyncHandler(async (req, res) => {

    const patientId = req.user._id;

    const { 
        requestedDateTime,
        paymentToken,              // razorpay_payment_id
        orderId,                   // razorpay_order_id
        razorpaySignature,         // signature
        patientQuery, 
    } = req.body;

    if (!requestedDateTime || !paymentToken || !orderId) {
        return res.status(400).json({ 
            message: "Date, Payment ID, and Order ID are required." 
        });
    }

    // 1. Verify Razorpay signature security
    const generated_signature = crypto
        .createHmac("sha256", process.env.KEY_SECRET)
        .update(orderId + "|" + paymentToken)
        .digest("hex");

    if (generated_signature !== razorpaySignature) {
        return res.status(400).json({ message: "Payment verification failed!" });
    }

    // 2. Capture payment (if needed)
    const paymentResult = await processPayment(
        paymentToken,
        req.user.email,
        CONSULTANCY_BOOKING_PRICE
    );

    if (paymentResult.status !== "Payment Successful") {
        return res.status(400).json({ message: "Payment capture failed!" });
    }
    // 3. Create Booking
    const booking = await ConsultationBooking.create({
        patientId,
        patientEmail: req.user.email,
        mobileNumber: req.user.mobileNumber,
        requestedDateTime,
        patientQuery,
        status: "Payment Successful",
        transactionId: paymentResult.id,
        orderId,
        paymentSignature: razorpaySignature,
    })

    await sendConsultationUpdateEmail(
        DOCTOR_EMAIL,
        'New Consultation Booking',
        `A new consultation has been booked for ${requestedDateTime} by patient ID: ${patientId}. Please review the booking details in your dashboard.`
    );

    await sendConsultationUpdateEmail(
        req.user.email,
        'Consultation Booking Confirmed',
        `Your consultation has been successfully booked for ${requestedDateTime}. We look forward to assisting you!`
    );

    res.status(201).json({
        message: "Consultation booked successfully!",
        booking
    });
});

// @desc    Patient creates a Razorpay order for consultation payment
// @route   POST /api/patient/create-order
// @access  Private/Patient
const createOrderId = asyncHandler(async (req, res) => {

    try {
        const order = await createRazorpayOrder();
        res.status(201).json({
            message: "Razorpay order created successfully.",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Patient retrieves all their consultation bookings
// @route   GET /api/patient/consultations
// @access  Private/Patient
const getPatientBookings = asyncHandler(async (req, res) => {
    const patientId = req.user._id; 

    const bookings = await ConsultationBooking.find({ patientId: patientId })
        .populate('doctorId', 'firstName lastName') // Only fetch the doctor's name
        .sort({ requestedDateTime: -1 }); // Sort by newest request first


    if (!bookings || bookings.length === 0) {
        return res.status(200).json({
            message: "No consultation bookings found.",
            bookings: []
        });
    }

    res.status(200).json({
        message: "Successfully fetched patient bookings.",
        bookings: bookings
    });
});

// @desc    Patient cancels a consultation booking and triggers a refund (if policy allows)
// @route   PATCH /api/patient/consultation-cancel/:bookingId
// @access  Private/Patient
const cancelBooking = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const { bookingId } = req.params;
    
    // 1. Fetch and validate the booking
    const booking = await ConsultationBooking.findOne({
        _id: bookingId,
        patientId: patientId // Security check: Ensure patient owns this booking
    });

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found or you do not have permission to cancel it.' });
    }

    // 2. Status Check
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
        return res.status(400).json({ message: `Booking is already in status: ${booking.status}. No action taken.` });
    }

    // 3. Determine Refund Eligibility & Amount (Simplified)
    const refundAmount = CONSULTANCY_BOOKING_PRICE ; 
    let refundSuccess = false;
    let refundError = null;
    
    // 4. Process Refund if transaction ID exists (i.e., payment was made)
    if (booking.transactionId) {
        try {
            // This must be done BEFORE saving the cancellation status
            const refundResult = await processRefund(booking.transactionId, refundAmount);
            if (refundResult.status === 'Refund Successful') {
                refundSuccess = true;
                booking.refundId = refundResult.id; 
            }
        } catch (error) {
            // Log the refund error, but DO NOT abort the cancellation
            console.error('Refund initiation failed:', error.message);
            refundError = error.message;
        }
    } else {
        // If no transaction ID, no payment was made, so no refund is needed.
        refundSuccess = true; 
    }

    // 5. Update Booking Status (CRUCIAL: This runs regardless of refund error)
    booking.status = 'Cancelled';
    await booking.save();

    // 6. Respond to Patient
    let refundMessage = '';
    if (booking.transactionId) {
        if (refundSuccess) {
            refundMessage = ` and a refund of $${refundAmount} has been initiated.`;
        } else {
            // Inform the patient that the refund failed and they need to contact support.
            refundMessage = `. The cancellation was logged, but the automatic refund initiation failed due to a system error. Please contact support immediately regarding your payment.`;
        }
    } else {
        refundMessage = '. No refund was necessary as payment was not completed.';
    }

    // 7. Notify Doctor of the Cancellation
    // sendEmail(doctorEmail, 'Consultation Cancelled', `Booking for ${booking.requestedDateTime} was cancelled by the patient.`);
    await sendConsultationUpdateEmail(
        DOCTOR_EMAIL,
        'Consultation Cancelled',
        `The consultation booking for ${booking.requestedDateTime} has been cancelled by the patient. Please review your schedule accordingly.`
    );

    await sendConsultationUpdateEmail(
        req.user.email,
        'Consultation Cancellation Confirmed',
        `Your consultation booking for ${booking.requestedDateTime} has been successfully cancelled.${refundMessage}`
    );

    res.status(200).json({
        message: `Consultation successfully cancelled${refundMessage}`,
        booking: booking
    });
});

// @desc Get logged-in patient's profile
// @route   GET /api/patient/profile
// @access  Private/Patient
const getPatientProfile = asyncHandler(async (req, res) => {
    // SECURITY: ID is pulled from the token
    const patientId = req.user._id;

    // Fetch the user, explicitly selecting fields the patient should see.
    // NOTE: NEVER send sensitive fields like 'password' or 'role' unless necessary.
    const user = await User.findById(patientId)
        .select('-password -role ') 

    if (!user) {
        // This should theoretically not happen if auth middleware is correct
        return res.status(404).json({ message: 'Patient profile not found.' });
    }

    res.status(200).json({
        message: 'Profile fetched successfully.',
        profile: user
    });
});

// @desc    Patient updates their password
// @route   POST /api/patient/update-password
// @access  Private/Patient
const updatePassword = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    if(!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    const user = await User.findById(patientId).select('+password');
    if(!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if(!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    await sendPasswordResetEmail(
        user.email,
        user.firstName,
        null // No reset link needed for password update
    );
    res.status(200).json({ message: 'Password updated successfully.' });
}
)

// @desc    Get tasks for a specific zone, enforcing sequential completion (Zone 1 to 5)
// @route   GET /api/patient/tasks/zone/:zoneNumber
// @access  Private/Patient
// @desc    Get tasks for a specific zone, enforcing sequential and forward progression
// @route   GET /api/patient/tasks/zone/:zoneNumber
// @access  Private/Patient
const getZoneTasks = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    console.log("Patient ID:", patientId);
    const requestedZone = parseInt(req.params.zoneNumber, 10);
    console.log("Requested Zone:", requestedZone);
    const MAX_ZONES = 5;

    // 1. Basic validation
    if (isNaN(requestedZone) || requestedZone < 1 || requestedZone > MAX_ZONES) {
        return res.status(400).json({
            message: "Invalid zone number. Must be between 1 and 5."
        });
    }

    // 2. Determine the next required zone based on current completion
    const highestCompletedZone = await findCurrentHighestCompletedZone(patientId);
    
    // The next required zone is one level above the highest completed zone.
    const nextRequiredZone = highestCompletedZone + 1;
    
    // If the highest completed zone is 5, the program is done.
    if (highestCompletedZone === MAX_ZONES) {
            return res.status(200).json({
                message: "Program is fully completed! Zone access is restricted to the final report.",
                programStatus: "Completed"
            });
    }
    
    // 3. FORWARD PROGRESSION CHECK (The new requirement)
    // Patient can only access the next required zone.
    if (requestedZone !== nextRequiredZone) {
        let accessMessage;
        let statusCode = 403; // Forbidden

        if (requestedZone < nextRequiredZone) {
            // Case A: Trying to fetch a zone that is already completed (e.g., requesting Zone 1 when Zone 2 is available)
            accessMessage = `Zone ${requestedZone} is already completed. Please proceed to Zone ${nextRequiredZone}.`;
        } else {
            // Case B: Trying to jump ahead (e.g., requesting Zone 3 when Zone 2 is required)
            // Note: This check implicitly covers the 'previous zone not complete' check.
            accessMessage = `Access denied. You must complete Zone ${nextRequiredZone} before accessing Zone ${requestedZone}.`;
        }
        
        return res.status(statusCode).json({
            message: accessMessage,
            nextRequiredZone: nextRequiredZone
        });
    }


    // 4. Fetch tasks for the requested zone (which is now guaranteed to be the nextRequiredZone)
    const zoneTasks = await PatientProgramTask.find({
        zone: requestedZone,
        patientId: patientId
    }).lean(); 

    // 5. Check for tasks
    if (!zoneTasks || zoneTasks.length === 0) {
        return res.status(404).json({ 
            message: `No tasks found for Zone ${requestedZone} for this patient. Please contact your doctor.`
        });
    }

    // 6. Send success response
    res.status(200).json({
        task: zoneTasks,
        message: `Tasks for current required Zone ${requestedZone} fetched successfully`,
        currentZone: requestedZone
    });
});

export {
    logTrackingData,
    logTaskCompletion,
    getPatientTasks,
    getPatientProgress,
    requestConsultation,
    getPatientBookings,
    cancelBooking,
    getPatientProfile,
    updatePassword,
    createOrderId,
    getZoneTasks
};