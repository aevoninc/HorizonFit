import express from 'express';
import {
  authLogin,
  refreshAccessToken,
  logoutUser,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// 1. Login (Public)
router.post('/login', authLogin);

// 2. Refresh Access Token (Public, relies on Refresh Token cookie)
router.get('/refresh-token', refreshAccessToken); 

// 3. Logout (Protected)
router.post('/logout', protect, logoutUser);

router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);


export default router;
