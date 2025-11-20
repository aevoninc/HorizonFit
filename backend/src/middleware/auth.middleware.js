// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../model/user.model.js';

// 1. JWT Verification Middleware
const protect = asyncHandler(async (req, res, next) => {
    // We are checking the short-lived Access Token cookie
    let token = req.cookies.accessToken; 

    if (token) {
        try {
            // Verify and decode the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Find user by ID (excluding password) and ATTACH the user object to the request
            // This makes the user's role and ID available to the next middleware/controller
            req.user = await User.findById(decoded.userId).select('-password'); 
            
            next();
        } catch (error) {
            console.error(error);
            // If verification fails (e.g., token expired or modified)
            res.status(401).json({ message: 'Not authorized, Access Token failed or expired.' });
        }
    } else {
        // No token cookie found
        res.status(401).json({ message: 'Not authorized, no Access Token.' });
    }
});

// 2. Role Verification Middleware
const isDoctor = (req, res, next) => {
    // This function runs AFTER 'protect' has successfully attached req.user
    
    // Check if the user object exists AND if the role field matches 'Doctor'
    if (req.user && req.user.role === 'Doctor') {
        next(); // Proceed to the controller function
    } else {
        // Logged in, but the role is 'Patient' or something else
        res.status(403).json({ message: 'Access Denied: Requires Doctor access.' });
    }
};

const isPatient = (req, res, next) => {
    // This function runs AFTER 'protect' has successfully attached req.user
    // Check if the user object exists AND if the role field matches 'Patient'
    if (req.user && req.user.role === 'Patient') {
        next(); // Proceed to the controller function
    } else {
        // Logged in, but the role is 'Doctor' or something else
        res.status(403).json({ message: 'Access Denied: Requires Patient access.' });
    }
};

export { protect, isDoctor,isPatient };