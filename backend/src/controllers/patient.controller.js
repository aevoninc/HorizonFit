// controllers/patientController.js
import asyncHandler from "../utils/asyncHandler.js";
import PatientTrackingData from "../model/patientTrackingData.model.js";
import User from "../model/user.model.js";
import PatientProgramTask from "../model/patientProgramTask.model.js";
import PatientTaskLog from "../model/patientTaskLog.model.js";
import ConsultationBooking from "../model/consultationBooking.model.js";
import programBookingModel from "../model/programBooking.model.js";
import {
  processPayment,
  processRefund,
  createRazorpayOrder,
} from "../utils/payment.js";
import {
  sendConsultationUpdateEmail,
  sendPasswordResetEmail,
  sendPatientWelcomeEmail,
  sendTaskAssignmentEmail,
  sendProgramBookingEmail,
} from "../utils/mailer.js";
import crypto from "crypto";
import {
  DOCTOR_EMAIL,
  DOCTOR_NAME,
  ADMIN_MAIL,
  CONSULTANCY_BOOKING_PRICE,
  PREMIUM_PROGRAM_BOOKING_PRICE,
  NORMAL_PROGRAM_BOOKING_PRICE,
} from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

const checkZoneCompletion = async (patientId, zone) => {
  // 1. Find all unique tasks that belong to the previous zone (N-1)
  const requiredTasks = await PatientProgramTask.find({
    patientId: patientId,
    zone: zone,
  })
    .select("_id")
    .lean();

  // If there are no required tasks in the zone, we assume the zone is completed (this shouldn't happen in a well-defined program)
  if (requiredTasks.length === 0) {
    return true;
  }

  const requiredTaskIds = requiredTasks.map((task) => task._id);

  // 2. Count how many of these tasks have been logged as completed by the patient
  // Note: Since PatientTaskLog schema is simple, we just count unique task IDs logged.
  const loggedCompletions = await PatientTaskLog.find({
    patientId: patientId,
    taskId: { $in: requiredTaskIds },
  })
    // We only care about unique tasks logged, so we count the number of distinct task IDs
    .distinct("taskId");

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
    return res
      .status(400)
      .json({
        message: "Missing required tracking data fields (type, value, unit).",
      });
  }

  // Fetch the patient's program start date to calculate the accurate weekNumber if not provided
  const patient = await User.findById(patientId).select(
    "programStartDate isActive"
  );
  if (!patient || !patient.isActive) {
    return res
      .status(401)
      .json({ message: "Account is inactive or not found." });
  }
  // Function to calculate the program week number based on start date and record date
  const calculatedWeekNumber = calculateProgramWeek(
    patient.programStartDate,
    recordDate
  );

  // 3. Create the tracking record
  const trackingRecord = await PatientTrackingData.create({
    patientId,
    type,
    value,
    unit,
    dateRecorded: recordDate || new Date(),
    weekNumber: calculatedWeekNumber, // <-- Use the calculated value
  });

  res.status(201).json({
    message: `${type} metric logged successfully for Week ${calculatedWeekNumber}.`,
    record: trackingRecord,
  });
});

// @desc    Patient logs a specific program task as complete
// @route   POST /api/patient/log-task/:taskId
// @access  Private/Patient
// backend/src/controllers/patient.controller.js
const logTaskCompletion = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { taskIds, completionDate } = req.body;

  if (!taskIds || !Array.isArray(taskIds)) {
    return res.status(400).json({ message: "No task IDs provided." });
  }

  const dateToLog = completionDate ? new Date(completionDate) : new Date();

  // Define date boundaries for duplicate check
  const startOfDay = new Date(dateToLog);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateToLog);
  endOfDay.setHours(23, 59, 59, 999);

  const results = [];

  // Use Promise.all for faster execution
  await Promise.all(
    taskIds.map(async (taskId) => {
      const masterTask = await PatientProgramTask.findOne({
        _id: taskId,
        patientId: patientId,
      });

      if (!masterTask) return;

      const existingLog = await PatientTaskLog.findOne({
        taskId: taskId,
        completionDate: { $gte: startOfDay, $lte: endOfDay },
      });

      // 1. Always ensure the Master Task is marked 'Completed'
      // regardless of whether the log for "today" exists.
      if (masterTask.status !== "Completed") {
        masterTask.status = "Completed";
        masterTask.completionDate = new Date();
        await masterTask.save();
      }

      // 2. Create the log only if it's missing for today
      if (!existingLog) {
        await PatientTaskLog.create({
          patientId,
          taskId,
          completionDate: dateToLog,
        });
        results.push(taskId);
      }
    })
  );

  res.status(200).json({
    message: `Successfully processed ${taskIds.length} tasks.`,
    loggedIds: results,
  });
});

// @desc    Get Patient's Program Tasks for Today with Compliance Status
// @route   GET /api/patient/tasks/today
// @access  Private/Patient
const getPatientTasks = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  // --- 1. Determine the Current Day ---
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayIndex = new Date().getDay();
  const currentDay = dayNames[currentDayIndex];

  // Define the start and end of TODAY for the compliance check
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  // --- 2. Fetch Master Tasks Applicable TODAY ---
  const applicableTasks = await PatientProgramTask.find({
    patientId: patientId,
    status: { $in: ["Pending", "Rescheduled"] }, // Only show tasks that aren't finished
    $or: [
      { frequency: "Daily" }, // Show Daily tasks
      { frequency: "Weekly" }, // Show Weekly tasks
      { frequency: "OneTime", status: "Pending" }, // Show pending OneTime tasks
      { daysApplicable: currentDay }, // Show tasks specific to today
    ],
  }).sort({ programWeek: 1, createdAt: 1 });

  if (applicableTasks.length === 0) {
    return res
      .status(200)
      .json({ message: "No active tasks found for today.", tasks: [] });
  }

  // --- 3. Check Compliance for Applicable Tasks ---
  // Fetch all relevant logs for the patient for TODAY
  const todayLogs = await PatientTaskLog.find({
    patientId: patientId,
    completionDate: { $gte: startOfToday, $lt: endOfToday },
  }).select("taskId");

  // Convert logs into a set for fast lookup
  const completedTaskIdsToday = new Set(
    todayLogs.map((log) => log.taskId.toString())
  );

  // --- 4. Annotate Tasks with Completion Status ---
  const tasksWithStatus = applicableTasks.map((task) => {
    const taskIdStr = task._id.toString();
    const isCompletedToday = completedTaskIdsToday.has(taskIdStr);

    // Daily/SpecificDays tasks should be marked completed today if logged
    if (task.frequency === "Daily" || task.frequency === "SpecificDays") {
      return {
        ...task.toObject(),
        isCompletedToday: isCompletedToday,
      };
    }

    // Weekly/OneTime tasks are generally marked completed via the status field, but we can confirm the log exists
    return {
      ...task.toObject(),
      isCompletedToday: isCompletedToday, // Useful if the log was just submitted
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
    .select("-patientId -updatedAt");

  // 2. Fetch all Compliance Logs (Proof of action history)
  const taskLogs = await PatientTaskLog.find({ patientId })
    .sort({ completionDate: 1 })
    .select("taskId completionDate"); // Only need the link and the date

  // 3. Fetch all Objective Health Metrics (Weight, Blood Sugar, etc.)
  const trackingData = await PatientTrackingData.find({ patientId })
    .sort({ dateRecorded: 1 })
    .select("type value unit dateRecorded weekNumber");

  // NOTE: The frontend will use these three datasets to calculate compliance percentages
  // and generate trend charts.

  res.status(200).json({
    message: "Patient progress data retrieved successfully.",
    masterTasks,
    taskLogs,
    trackingData,
  });
});

// @desc    Patient requests a consultation after choosing a specific date/time via Calendly
// @route   POST /api/patient/consultation-request
// @access  Private/Patient
const requestConsultation = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  // Get user details from the auth middleware
  let { name, email, mobileNumber } = req.user;
  mobileNumber = "8610622587";
  const {
    requestedDateTime,
    paymentToken,
    orderId,
    razorpaySignature,
    patientQuery,
  } = req.body;

  // 1. Initial Validation
  if (!requestedDateTime || !paymentToken || !orderId || !razorpaySignature) {
    return res.status(400).json({
      message: "Missing required payment details or appointment date.",
    });
  }

  // 2. Security Check (Signature Verification)
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + "|" + paymentToken)
    .digest("hex");

  if (generated_signature !== razorpaySignature) {
    return res
      .status(400)
      .json({ message: "Security Check Failed: Invalid Signature" });
  }

  // 3. Save to Database
  const booking = await ConsultationBooking.create({
    patientId,
    patientEmail: email, // Changed from 'email' to 'patientEmail' to match your schema
    mobileNumber: mobileNumber,
    requestedDateTime,
    patientQuery: patientQuery || "General Consultation",
    status: "Payment Successful", // Matches your schema enum
    transactionId: paymentToken,
    orderId,
    paymentSignature: razorpaySignature,
  });

  try {
    await Promise.allSettled([
      // 1. Email to Doctor
      sendConsultationUpdateEmail({
        recipient: DOCTOR_EMAIL,
        personName: `Dr. ${DOCTOR_NAME}`, // Use the doctor's name
        doctor: name, // The Patient's name (from req.body)
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),

      // 2. Email to Admin
      sendConsultationUpdateEmail({
        recipient: ADMIN_MAIL,
        personName: "Admin",
        doctor: name, // Patient's name for admin reference
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),

      // 3. Email to Patient
      sendConsultationUpdateEmail({
        recipient: email, // The user's email from req.body
        personName: name, // The user's name from req.body
        doctor: DOCTOR_NAME,
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),
    ]);
  } catch (emailError) {
    console.error("Error sending consultation booking emails:", emailError);
  }

  res.status(201).json({
    message: "Consultation booked successfully!",
    booking,
  });
});

// @desc    Patient creates a Razorpay order for consultation payment
// @route   POST /api/patient/create-order
// @access  Private/Patient
const createOrderId = asyncHandler(async (req, res) => {
  const PRICES = { consultation: 599 }; // Changed to 599 to match your frontend button

  try {
    const order = await createRazorpayOrder(PRICES.consultation);

    res.status(201).json({
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    // THIS LINE IS ESSENTIAL FOR DEBUGGING
    console.error("BACKEND CRASH:", error);
    res.status(500).json({
      message: "Razorpay Error: " + error.message,
    });
  }
});

// @desc    Patient retrieves all their consultation bookings
// @route   GET /api/patient/consultations
// @access  Private/Patient
const getPatientBookings = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  // Use a lean query for faster read performance since we are just displaying data
  const bookings = await ConsultationBooking.find({ patientId: patientId })
    // OPTION A: If doctorId is not in schema yet, comment this out to stop the 500 error
    // .populate('doctorId', 'firstName lastName')
    .sort({ requestedDateTime: -1 })
    .lean();

  // Always return a consistent structure
  res.status(200).json({
    message:
      bookings.length > 0
        ? "Successfully fetched patient bookings."
        : "No consultation bookings found.",
    bookings: bookings || [],
  });
});

// @desc    Patient cancels a consultation booking and triggers a refund (if policy allows)
// @route   PATCH /api/patient/consultation-cancel/:bookingId
// @access  Private/Patient

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user._id;

  const booking = await ConsultationBooking.findOne({ _id: id, patientId });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }
  // --- 24-HOUR POST-PAYMENT CHECK ---
  const now = new Date();
  const paymentTime = new Date(booking.createdAt); // When the record was created
  const diffInMilliseconds = now - paymentTime;
  const hoursSincePayment = diffInMilliseconds / (1000 * 60 * 60);

  if (hoursSincePayment > 24) {
    return res.status(400).json({
      message:
        "Refunds are only available within 24 hours of payment. This window has expired.",
    });
  }

  if (booking.status === "Cancelled") {
    return res.status(400).json({ message: "Booking is already cancelled." });
  }
  try {
    // 2. USE YOUR UTILITY FUNCTION HERE
    // Use the function you already wrote in payment.js
    const refundResult = await processRefund(
      booking.transactionId,
      CONSULTANCY_BOOKING_PRICE
    );
    // 3. Update Database using the result from the utility
    booking.status = "Cancelled";
    booking.refundId = refundResult.id;
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled and refund initiated successfully.",
      refundId: refundResult.id,
      status: booking.status,
    });
  } catch (error) {
    console.error("Refund Logic Error:", error.message);
    res.status(500).json({
      message: error.message || "Refund failed. Please contact support.",
    });
  }
});

// @desc Get logged-in patient's profile
// @route   GET /api/patient/profile
// @access  Private/Patient
const getPatientProfile = asyncHandler(async (req, res) => {
  // SECURITY: ID is pulled from the token
  const patientId = req.user._id;

  // Fetch the user, explicitly selecting fields the patient should see.
  // NOTE: NEVER send sensitive fields like 'password' or 'role' unless necessary.
  const user = await User.findById(patientId).select("-password -role ");

  if (!user) {
    // This should theoretically not happen if auth middleware is correct
    return res.status(404).json({ message: "Patient profile not found." });
  }

  res.status(200).json({
    message: "Profile fetched successfully.",
    profile: user,
  });
});

// @desc    Patient updates their password
// @route   POST /api/patient/update-password
// @access  Private/Patient
const updatePassword = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new passwords are required." });
  }
  const user = await User.findById(patientId).select("+password");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }
  user.password = newPassword;
  await user.save();
  await sendPasswordResetEmail(
    user.email,
    user.firstName,
    null // No reset link needed for password update
  );
  res.status(200).json({ message: "Password updated successfully." });
});

// @desc    Get tasks for a specific zone, enforcing sequential completion (Zone 1 to 5)
// @route   GET /api/patient/tasks/zone/:zoneNumber
// @access  Private/Patient
// @desc    Get tasks for a specific zone, enforcing sequential and forward progression
// @route   GET /api/patient/tasks/zone/:zoneNumber
// @access  Private/Patient
const getZoneTasks = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const requestedZone = parseInt(req.params.zoneNumber, 10);
  const MAX_ZONES = 5;
  const patient = await User.findById(patientId);
  if(patient.currentZone != requestedZone){
return res.status(403).json({
  message: `You can only access your current zone (${patient.currentZone})`,
  currentZone: patient.currentZone
});
  }
  // // 1. Basic validation
  // if (isNaN(requestedZone) || requestedZone < 1 || requestedZone > MAX_ZONES) {
  //   return res.status(400).json({
  //     message: "Invalid zone number. Must be between 1 and 5.",
  //   });
  // }

  // // 2. Determine the next required zone based on current completion
  // const highestCompletedZone = await findCurrentHighestCompletedZone(patientId);

  // // The next required zone is one level above the highest completed zone.
  // const nextRequiredZone = highestCompletedZone + 1;

  // // If the highest completed zone is 5, the program is done.
  // if (highestCompletedZone === MAX_ZONES) {
  //   return res.status(200).json({
  //     message:
  //       "Program is fully completed! Zone access is restricted to the final report.",
  //     programStatus: "Completed",
  //   });
  // }

  // // 3. FORWARD PROGRESSION CHECK (The new requirement)
  // // Patient can only access the next required zone.
  // if (requestedZone !== nextRequiredZone) {
  //   let accessMessage;
  //   let statusCode = 403; // Forbidden

  //   if (requestedZone < nextRequiredZone) {
  //     // Case A: Trying to fetch a zone that is already completed (e.g., requesting Zone 1 when Zone 2 is available)
  //     accessMessage = `Zone ${requestedZone} is already completed. Please proceed to Zone ${nextRequiredZone}.`;
  //   } else {
  //     // Case B: Trying to jump ahead (e.g., requesting Zone 3 when Zone 2 is required)
  //     // Note: This check implicitly covers the 'previous zone not complete' check.
  //     accessMessage = `Access denied. You must complete Zone ${nextRequiredZone} before accessing Zone ${requestedZone}.`;
  //   }

  //   return res.status(statusCode).json({
  //     message: accessMessage,
  //     nextRequiredZone: nextRequiredZone,
  //   });
  // }

  // 4. Fetch tasks for the requested zone (which is now guaranteed to be the nextRequiredZone)
  const zoneTasks = await PatientProgramTask.find({
    zone: requestedZone,
    patientId: patientId,
  }).lean();

  // 5. Check for tasks
  if (!zoneTasks || zoneTasks.length === 0) {
    return res.status(404).json({
      message: `No tasks found for Zone ${requestedZone} for this patient. Please contact your doctor.`,
    });
  }

  // 6. Send success response
  res.status(200).json({
    task: zoneTasks,
    message: `Tasks for current required Zone ${requestedZone} fetched successfully`,
    currentZone: requestedZone,
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
  getZoneTasks,
};
