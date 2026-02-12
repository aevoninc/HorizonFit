import express from 'express';
const router = express.Router();
import {
  getNormalPlanPatients,
  getNormalPlanPatientDetail,
  updatePatientStatus,
  addDoctorNote,
  overridePatientZone,
  overrideRecommendations,
  getDIYTaskTemplates,
  createDIYTaskTemplate,
  updateDIYTaskTemplate,
  deleteDIYTaskTemplate,
  addPatientCustomTask,
  getZoneVideos,
  createZoneVideo,
  updateZoneVideo,
  deleteZoneVideo,
  getHorizonGuideVideos,
  createHorizonGuideVideo,
  updateHorizonGuideVideo,
  deleteHorizonGuideVideo,
  getDailyActivityReport,
  getPatientTrends
} from '../controllers/normalPlanDoctor.controller.js';

import { protect, isDoctor } from "../middleware/auth.middleware.js";

// Apply auth middleware
router.use(protect);
router.use(isDoctor);

// Patient Management
router.get('/patients', getNormalPlanPatients);
router.get('/patients/:patientId', getNormalPlanPatientDetail);
router.patch('/patients/:patientId/status', updatePatientStatus);
router.post('/patients/:patientId/notes', addDoctorNote);
router.post('/patients/:patientId/override-zone', overridePatientZone);
router.post('/patients/:patientId/override-recommendations', overrideRecommendations);
router.post('/patients/:patientId/custom-task', addPatientCustomTask);

// DIY Task Templates
router.get('/diy-tasks', getDIYTaskTemplates);
router.post('/diy-tasks', createDIYTaskTemplate);
router.patch('/diy-tasks/:taskId', updateDIYTaskTemplate);
router.delete('/diy-tasks/:taskId', deleteDIYTaskTemplate);

// Zone Videos
router.get('/zone-videos', getZoneVideos);
router.post('/zone-videos', createZoneVideo);
router.patch('/zone-videos/:videoId', updateZoneVideo);
router.delete('/zone-videos/:videoId', deleteZoneVideo);

// Horizon Guide Videos
router.get('/horizon-videos', getHorizonGuideVideos);
router.post('/horizon-videos', createHorizonGuideVideo);
router.patch('/horizon-videos/:videoId', updateHorizonGuideVideo);
router.delete('/horizon-videos/:videoId', deleteHorizonGuideVideo);

// Analytics & Monitoring
router.get('/daily-report', getDailyActivityReport);
router.get('/patients/:patientId/trends', getPatientTrends);

export default router;