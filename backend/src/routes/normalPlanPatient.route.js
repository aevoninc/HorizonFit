import express from 'express';
const router = express.Router();

import {getNormalPlanProgress }from '../controllers/normalPlanPatient.controller.js';
import {checkVideoCompletion }from '../controllers/normalPlanPatient.controller.js';
import {canEnterMetrics} from '../controllers/normalPlanPatient.controller.js';
import {submitBodyMetrics} from '../controllers/normalPlanPatient.controller.js';
import {getHorizonGuideVideos} from '../controllers/normalPlanPatient.controller.js';
import {markVideoWatched} from '../controllers/normalPlanPatient.controller.js';
import {submitDailyLog} from '../controllers/normalPlanPatient.controller.js';
import {getTodayLog }from '../controllers/normalPlanPatient.controller.js';
import {getDailyLogsHistory} from '../controllers/normalPlanPatient.controller.js';
import {submitWeeklyLog} from '../controllers/normalPlanPatient.controller.js';
import {getDIYTasks} from '../controllers/normalPlanPatient.controller.js';
import { protect, isPatient } from "../middleware/auth.middleware.js";

// Apply auth middleware
router.use(protect);
router.use(isPatient);

// Progress & Zone
router.get('/progress', getNormalPlanProgress);
router.get('/check-videos', checkVideoCompletion);

// Metrics
router.get('/can-enter-metrics', canEnterMetrics);
router.post('/metrics', submitBodyMetrics);

// Videos
router.post('/videos/:videoId/watched', markVideoWatched);
router.get('/horizon-guide', getHorizonGuideVideos);

// Daily Logs
router.post('/daily-log', submitDailyLog);
router.get('/daily-log/today', getTodayLog);
router.get('/daily-logs', getDailyLogsHistory);

// Weekly Logs
router.post('/weekly-log', submitWeeklyLog);

// DIY Tasks
router.get('/diy-tasks', getDIYTasks);

export default router;