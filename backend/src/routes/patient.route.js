// routes/patientRoutes.js
import { protect, isPatient } from "../middleware/auth.middleware.js";
import {
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
} from "../controllers/patient.controller.js";
import PatientDailyResponse from "../model/PatientDailyResponse.model.js";
import express from "express";
export const router = express.Router();

router.use(protect);

// Patient logs a health metric
router.post("/log-tracking-data", isPatient, logTrackingData);

// Patient logs task completion
router.post("/logTaskCompletion", isPatient, logTaskCompletion);

// Get patient tasks
router.get("/getPatientTasks", isPatient, getPatientTasks);

// Get patient progress
router.get("/getPatientProgress", protect, isPatient, getPatientProgress);

// Request a consultation
router.post("/consultation-request", protect, isPatient, requestConsultation);

// Get patient bookings
router.get("/getPatientBookings", protect, isPatient, getPatientBookings);

// Cancel a booking
router.post("/cancelBooking/:id", protect, isPatient, cancelBooking);

// Get patient profile
router.get("/getPatientProfile", protect, isPatient, getPatientProfile);

// Update patient password
router.post("/update-password", protect, isPatient, updatePassword);

// Create Razorpay Order ID
router.post("/create-order", createOrderId);

router.get("/get-zone-task/:zoneNumber", getZoneTasks);

// Route to submit daily responses
router.post("/submit-daily-response", isPatient, async (req, res) => {
  const {
    patientId,
    breakfast,
    lunch,
    dinner,
    meditationMinutes,
    waterLitres,
    exerciseMinutes,
    sleepFrom,
    sleepTo,
  } = req.body;

  // Normalize to today's date range (start and end of day)
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);

  try {
    // Check if response for today already exists for this patient
    const existingResponse = await PatientDailyResponse.findOne({
      patientId,
      date: { $gte: start, $lte: end },
    });
    if (existingResponse) {
      return res
        .status(400)
        .json({ message: "You have already submitted your responses for today." });
    }

    // Create a new response with date normalized to start of day
    const response = new PatientDailyResponse({
      patientId,
      date: start,
      breakfast,
      lunch,
      dinner,
      meditationMinutes,
      waterLitres,
      exerciseMinutes,
      sleepFrom,
      sleepTo,
    });

    await response.save();
    res
      .status(200)
      .json({ message: "Thank you, your response has been recorded." });
  } catch (error) {
    console.error('Error saving daily response:', error);
    res
      .status(500)
      .json({ message: "An error occurred while saving your response." });
  }
});

// Route to get daily responses for a specific patient (accessible by both patient and doctor)
router.get('/daily-responses/:patientId', protect, async (req, res) => {
    const { patientId } = req.params;
    try {
        const responses = await PatientDailyResponse.find({ patientId }).sort({ date: -1 });
        res.status(200).json(responses || []);
    } catch (error) {
        console.error('Error fetching daily responses:', error);
        res.status(500).json({ message: 'An error occurred while fetching responses.' });
    }
});

export default router;
