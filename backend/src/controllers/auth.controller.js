import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import RefreshToken from "../model/RefreshToken.model.js";

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRY } // Short-lived Access Token
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_SECRET_EXPIRY } // Long-lived Refresh Token
  );
};

const setTokens = async (res, userId, role) => {
  // 1. GENERATE TOKENS
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  // Define expiry times in milliseconds
  const ACCESS_MINUTES =
    parseInt(process.env.JWT_ACCESS_SECRET_EXPIRY, 10) || 30;
  const REFRESH_DAYS =
    parseInt(process.env.JWT_REFRESH_SECRET_EXPIRY, 10) || 30;
  const maxAgeAccess = ACCESS_MINUTES * 60 * 60 * 1000; // 15 minutes
  const maxAgeRefresh = REFRESH_DAYS * 24 * 60 * 60 * 1000; // 30 days
  // 2. SET ACCESS TOKEN COOKIE (Short-Lived)
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // CRITICAL: Prevents client-side JS (XSS attacks) from reading the token.
    secure: process.env.NODE_ENV !== "development", // Ensures cookie is only sent over HTTPS (in production).
    sameSite: "strict", // Helps mitigate Cross-Site Request Forgery (CSRF).
    maxAge: maxAgeAccess, // Token expires after 15 minutes.
  });

  // 3. SET REFRESH TOKEN COOKIE (Long-Lived)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // CRITICAL: Cannot be accessed by client-side JS.
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: maxAgeRefresh, // Token expires after 30 days.
  });

  return { accessToken, refreshToken }; // Returns tokens (the Access Token is often returned in the body for frontend convenience)
};

const authLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }
  const user = await User.findOne({ email }).select("+password");

  if (user && (await user.matchPassword(password))) {
    // --- 1. Successful Authentication (NO ROLE CHECK) ---
    const { accessToken, refreshToken } = await setTokens(
      res,
      user._id,
      user.role
    );

    // --- 2. Store Refresh Token Securely ---
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip;

    // Delete old token for this device/user combo before inserting new one (optional cleanup)
    // await RefreshToken.deleteOne({ userId: user._id, userAgent, ipAddress });

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      userAgent,
      ipAddress,
      expiresAt: new Date(
        Date.now() +
          parseInt(process.env.JWT_REFRESH_SECRET_EXPIRY, 10) *
            24 *
            60 *
            60 *
            1000
      ), // Matches cookie maxAge
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name, // Make sure name is in your schema!
      },
      role: user.role,
      // accessToken: accessToken // Keep this only if frontend needs it for non-cookie requests
    });
  } else {
    res.status(401).json({ message: "Invalid email or password." });
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token found." });
  }

  try {
    // 1. Check if the token exists in the database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      // Token is invalid/revoked/expired from DB
      return res
        .status(403)
        .json({ message: "Revoked or invalid refresh token." });
    }

    // 2. Verify the JWT signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Find user and issue new Access Token
    const user = await User.findById(decoded.userId).select("role");
    const newAccessToken = generateAccessToken(user._id, user.role);

    // 4. Set the new Access Token cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // 1. Invalidate the Refresh Token in the database (CRITICAL STEP)
  if (refreshToken) {
    // Since the RefreshToken model stores the raw token, we can delete it directly.
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  // 2. Clear the Access Token cookie in the browser
  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0), // Set expiry to the past to force deletion
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });

  // 3. Clear the Refresh Token cookie in the browser
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0), // Set expiry to the past to force deletion
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });

  res.status(200).json({ message: "User logged out successfully." });
});

export { authLogin, refreshAccessToken, logoutUser };
