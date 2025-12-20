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
    getCompletedPatients,
    getDeactivatedPatients,
    getNewConsultancyRequest,
    deletePatient,
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignProgramToPatient
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
router.patch("/update-consultation-status/:id", updateConsultationStatus);

// Deactivate a Patient's Account
router.patch("/deactivate-patient/:patientId", deactivatePatient);

// Get Completed Patients (who have finished their 15-week program)
router.get("/completed-patients", getCompletedPatients);

// Get Deactivated Patients
router.get("/deactivated-patients", getDeactivatedPatients);

// Get Bookings with getNewConsultancyRequest patientId
router.get("/get-new-consultancy-request", getNewConsultancyRequest);

//delete all the record of the patient
router.delete("/delete-patient/:patientId",deletePatient);

// Get all available templates (e.g., Weight Loss, Diabetes) for a dropdown
router.get("/templates", getAllTemplates);

// Get the specific 15-week matrix for a template to view/edit
router.get("/templates/:id", getTemplateById);

// Create a new master program template
router.post("/templates", createTemplate);

// Update the 15-week matrix globally
router.put("/templates/:id", updateTemplate);

// Delete a master template
router.delete("/templates/:id", deleteTemplate);

// --- ASSIGNMENT ROUTE ---

// One-click assign: takes a template and creates all tasks for a patient
router.post("/assign-program/:patientId", assignProgramToPatient);

export default router;