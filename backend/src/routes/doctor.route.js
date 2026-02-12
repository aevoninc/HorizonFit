import express from "express";
import { authLogin } from "../controllers/auth.controller.js";
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
  assignProgramToPatient,
} from "../controllers/doctor.controller.js";
import { protect, isDoctor } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =======================
   PUBLIC ROUTE (NO AUTH)
======================= */

// Doctor Login
router.post("/login", authLogin);

/* =======================
   PROTECTED ROUTES
======================= */

router.use(protect, isDoctor);

// Create a new Patient
router.post("/create-patient", createPatient);

// Get list of all Patients
router.get("/patients", getPatientList);

// Allocate tasks
router.post("/allocate-tasks/:patientId", allocateTasks);

// Get Patient Progress
router.get("/patient-progress/:patientId", getPatientProgress);

// Update task
router.patch("/update-task/:taskId", updateTask);

// Delete task
router.delete("/delete-task/:taskId", deleteTask);

// Consultation requests
router.get("/consultation-requests", getConsultationRequests);

// Update consultation status
router.patch("/update-consultation-status/:id", updateConsultationStatus);

// Deactivate patient
router.patch("/deactivate-patient/:patientId", deactivatePatient);

// Completed patients
router.get("/completed-patients", getCompletedPatients);

// Deactivated patients
router.get("/deactivated-patients", getDeactivatedPatients);

// New consultancy requests
router.get("/get-new-consultancy-request", getNewConsultancyRequest);

// Delete patient
router.delete("/delete-patient/:patientId", deletePatient);

// Templates
router.get("/templates", getAllTemplates);
router.get("/templates/:id", getTemplateById);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

// Assign program
router.post("/assign-program/:patientId", assignProgramToPatient);

export default router;
