// routes/patientRoutes.js
import { 
    protect, 
    isPatient 
} from "../middleware/auth.middleware.js"
import { 
    logTrackingData, 
    logTaskCompletion 
} from '../controllers/patient.controller.js';
import express from 'express';
export const router = express.Router();

router.use(protect, isPatient);

// Patient logs a health metric
router.post('/log-metric', protect, isPatient, logTrackingData);

// Patient logs task completion
router.post('/log-task/:taskId', protect, isPatient, logTaskCompletion);

export default router;