// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../model/user.model.js';

// 1. Protect Middleware
const protect = asyncHandler(async (req, res, next) => {
    let token = null;

    // Cookie token
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    // Authorization header token
    else if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = await User.findById(decoded.userId).select("-password");
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token invalid/expired' });
    }
});

// 2. Doctor Access
const isDoctor = (req, res, next) => {
    if (req.user && req.user.role.toLowerCase() === "doctor") {
        return next();
    }
    return res.status(403).json({ message: 'Access Denied: Requires Doctor access.' });
};

// 3. Patient Access
const isPatient = (req, res, next) => {
    if (req.user && req.user.role.toLowerCase() === "patient") {
        return next();
    }
    return res.status(403).json({ message: 'Access Denied: Requires Patient access.' });
};

export { protect, isDoctor, isPatient };
