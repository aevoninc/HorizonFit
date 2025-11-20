import {
    createPatient,
    getPatientList,
    allocateTasks,
    getPatientProgress,
    updateTask,
    deleteTask,
    getConsultationRequests,
    updateConsultationStatus,
    deactivatePatient,
    getCompletedPatients
} from "../controllers/doctor.controller.js"
import { protect, isDoctor } from '../middleware/auth.middleware.js';
import express from "express"

const router = express.Router();

router.use(protect, isDoctor); // Apply protect and isDoctor middleware to all routes in this file

// Create a new Patient (Manual process done by Doctor/Admin)
router.post("/create-patient",createPatient);

// Get list of all Patients (for Doctor's dashboard view)
router.get("/patients",getPatientList);

// Doctor allocates tasks and program metrics to a specific patient
router.post("/allocate-tasks/:patientId",allocateTasks);

// Get Patient Progress Data
router.get("/patient-progress/:patientId",getPatientProgress);

// Update a specific task for a patient
router.patch("/update-task/:taskId",updateTask);

// Delete a specific task for a patient
router.delete("/delete-task/:taskId",deleteTask);

// Get Consultation Requests for the Doctor
router.get("/consultation-requests", getConsultationRequests);

// Update Consultation Status (Confirm, Reschedule, Cancel)
router.patch("/update-consultation-status/:bookingId", updateConsultationStatus);

// Deactivate a Patient's Account
router.patch("/deactivate-patient/:patientId", deactivatePatient);

// Get Completed Patients (who have finished their 15-week program)
router.get("/completed-patients", getCompletedPatients);


export default router;