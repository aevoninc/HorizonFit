// controllers/patientController.js
import asyncHandler from '../utils/asyncHandler.js';
import PatientTrackingData from '../model/patientTrackingData.model.js'; 
import User from '../model/user.model.js';  
import PatientProgramTask from '../model/patientProgramTask.model.js'; 
import PatientTaskLog from '../model/patientTaskLog.model.js';
import consultationBookingModel from '../model/consultationBooking.model.js';


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
    const { type, value, unit, dateRecorded, weekNumber } = req.body;

    // Optional: Basic validation to ensure all required data is present
    if (!type || value === undefined || !unit) {
        return res.status(400).json({ message: 'Missing required tracking data fields (type, value, unit).' });
    }
    
    // Fetch the patient's program start date to calculate the accurate weekNumber if not provided
    const patient = await User.findById(patientId).select('programStartDate');
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
        requestedDateTime, // The confirmed time from Calendly
        paymentToken,      // Token received from the frontend after payment interaction
        patientQuery, 
        feeAmount = 50     // Example: Fee is fixed
    } = req.body;

    if (!requestedDateTime || !paymentToken) {
        return res.status(400).json({ message: 'Confirmed date and payment token are required.' });
    }

    // 1. Fetch patient and doctor information
    const patient = await User.findById(patientId).select('assignedDoctorId email');
    const doctorId = patient?.assignedDoctorId;

    if (!doctorId) {
        return res.status(404).json({ message: 'No assigned doctor found.' });
    }

    // 2. Process Payment
    let transactionId = null;
    let paymentStatus = 'Awaiting Payment';
    
    try {
        // In a real app, this calls Stripe/PayPal/etc.
        const paymentResult = await processPayment(feeAmount, paymentToken, patient.email);
        
        transactionId = paymentResult.id; 
        paymentStatus = 'Payment Successful';

    } catch (error) {
        console.error('Payment Error:', error);
        return res.status(402).json({ message: 'Payment failed. Please try again or check your card details.' });
    }

    // 3. Create the Booking Record
    const booking = await ConsultationBooking.create({
        patientId,
        doctorId,
        requestedDateTime: new Date(requestedDateTime),
        confirmedDateTime: new Date(requestedDateTime), // Initially confirmed by patient/Calendly
        patientQuery: patientQuery || 'General Consultation',
        status: paymentStatus,
        transactionId: transactionId 
    });

    // get the doctor's email from the User model
    // sendEmail(doctorEmail, 'New Confirmed Consultation', `Booking at ${booking.requestedDateTime.toLocaleString()}`);

    res.status(201).json({ 
        message: 'Consultation successfully booked and payment processed.', 
        booking 
    });
});


// @desc    Patient retrieves all their consultation bookings
// @route   GET /api/patient/consultations
// @access  Private/Patient
const getPatientBookings = asyncHandler(async (req, res) => {
    const patientId = req.user._id; 

    const bookings = await ConsultationBooking.find({ patientId: patientId })
        .populate('doctorId', 'firstName lastName') // Only fetch the doctor's name
        .sort({ requestedDateTime: -1 }); // Sort by newest request first

    // 3. RESPONSE: If no bookings are found, it returns an empty array, 
    // so we just return the array with a success message.
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


export {
    logTrackingData,
    logTaskCompletion,
    getPatientTasks,
    getPatientProgress,
    requestConsultation,
    getPatientBookings
};