// routes/patientRoutes.js
import { 
    protect, 
    isPatient 
} from "../middleware/auth.middleware.js"
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
    createOrderId
} from '../controllers/patient.controller.js';
import express from 'express';
export const router = express.Router();

router.use(protect, isPatient);

// Patient logs a health metric
router.post('/log-tracking-data', protect, isPatient, logTrackingData);

// Patient logs task completion
router.post('/logTaskCompletion/:taskId', protect, isPatient, logTaskCompletion);

// Get patient tasks
router.get('/getPatientTasks', protect, isPatient, getPatientTasks);

// Get patient progress
router.get('/getPatientProgress', protect, isPatient, getPatientProgress);

// Request a consultation
router.post('/consultation-request', protect, isPatient, requestConsultation);

// Get patient bookings
router.get('/getPatientBookings', protect, isPatient, getPatientBookings);

// Cancel a booking
router.post('/cancelBooking/:bookingId', protect, isPatient, cancelBooking);

// Get patient profile
router.get('/getPatientProfile', protect, isPatient, getPatientProfile);

// Update patient password
router.post('/update-password', protect, isPatient, updatePassword);

// Create Razorpay Order ID
router.post('/create-order', protect, isPatient, createOrderId);

export default router;