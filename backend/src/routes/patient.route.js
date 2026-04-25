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
  allocateTasks,
  deleteTask,
} from "../controllers/patient.controller.js";
import {
  getTodayHabits,
  submitHabits,
  getHabitGuide,
  getProgramStatus,
  getHabitHistory,
} from "../controllers/habitGuide.controller.js";
import express from "express";
export const router = express.Router();

router.use(protect, isPatient);

// Patient logs a health metric
router.post("/log-tracking-data", protect, isPatient, logTrackingData);

// Patient logs task completion
router.post("/logTaskCompletion", protect, isPatient, logTaskCompletion);

// Get patient tasks
router.get("/getPatientTasks", protect, isPatient, getPatientTasks);

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

// Allocate custom task
router.post("/allocate-tasks", protect, isPatient, allocateTasks);

// Delete custom task
router.delete("/tasks/:taskId", protect, isPatient, deleteTask);

// --- HABIT TRACKER ROUTES ---
router.get("/program-status", protect, isPatient, getProgramStatus);
router.get("/habits/today", protect, isPatient, getTodayHabits);
router.post("/habits/submit", protect, isPatient, submitHabits);
router.get("/habits/history", protect, isPatient, getHabitHistory);
router.get("/habits/:habitCode/guide", protect, isPatient, getHabitGuide);

export default router;
