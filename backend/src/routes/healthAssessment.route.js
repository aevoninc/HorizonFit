import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { getHealthAssessmentReport, submitHealthAssessment } from '../controllers/healthAssessment.controller.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, fieldSize: 32 * 1024 },
});
const assessmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many assessment submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const reportAccessLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { message: 'Too many report access attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const receiveReport = (req, res, next) => upload.single('report')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ message: 'The report upload is invalid or exceeds the 5 MB limit.' });
    }
    return next(error);
});

router.post('/health-assessment', assessmentLimiter, receiveReport, submitHealthAssessment);
router.get('/health-assessment/report', reportAccessLimiter, getHealthAssessmentReport);

export default router;