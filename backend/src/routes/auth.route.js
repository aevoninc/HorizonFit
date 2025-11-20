import express from 'express';
import { authLogin,refreshAccessToken,logoutUser } from '../controllers/auth.controller.js';
import { protect, isDoctor } from '../middleware/auth.middleware.js';

const router = express.Router();

// 1. Login (Public)
router.post('/login', authLogin);

// 2. Refresh Access Token (Public, relies on Refresh Token cookie)
router.get('/refresh-token', refreshAccessToken); 

// 3. Logout (Protected)
router.post('/logout', protect, logoutUser);


export default router;