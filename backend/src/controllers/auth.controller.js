import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import RefreshToken from "../model/refreshToken.model.js";

// Helper to parse expiry string like '15m' or '30d' into milliseconds
const parseExpiry = (expiryStr, defaultMs) => {
  if (!expiryStr) return defaultMs;
  // Strip quotes and whitespace if any remain
  const cleanStr = expiryStr.toString().replace(/['"]/g, "").trim();
  const value = parseInt(cleanStr, 10);
  if (isNaN(value)) return defaultMs;

  if (cleanStr.endsWith("d")) return value * 24 * 60 * 60 * 1000;
  if (cleanStr.endsWith("m")) return value * 60 * 1000;
  if (cleanStr.endsWith("h")) return value * 60 * 60 * 1000;
  if (cleanStr.endsWith("s")) return value * 1000;
  return value; // Assume ms if no suffix
};

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

const setTokens = async (res, userId, role, planTier) => {
  // 1. GENERATE TOKENS
  const accessToken = generateAccessToken(userId, role, planTier);
  const refreshToken = generateRefreshToken(userId);

  const isProd = process.env.NODE_ENV?.trim().toLowerCase() === "production";

  const maxAgeAccess = parseExpiry(process.env.JWT_ACCESS_SECRET_EXPIRY, 15 * 60 * 1000);
  const maxAgeRefresh = parseExpiry(process.env.JWT_REFRESH_SECRET_EXPIRY, 30 * 24 * 60 * 60 * 1000);

  // 2. SET ACCESS TOKEN COOKIE (Short-Lived)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: maxAgeAccess,
  });

  // 3. SET REFRESH TOKEN COOKIE (Long-Lived)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: maxAgeRefresh,
  });

  return { accessToken, refreshToken };
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
      user.role,
      user.planTier || "normal"
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
        parseExpiry(process.env.JWT_REFRESH_SECRET_EXPIRY, 30 * 24 * 60 * 60 * 1000)
      ),
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name, // Make sure name is in your schema!
      },
      role: user.role,
      planTier: user.planTier || "normal",
      accessToken,
      refreshToken,
      message: "Login successful.",
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
      return res.status(403).json({ message: "Revoked or invalid refresh token." });
    }

    // 2. Verify the JWT signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Find user and issue new Access Token
    const user = await User.findById(decoded.userId).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    // 4. Set the new Access Token cookie (use same robust logic)
    const isProd = process.env.NODE_ENV?.trim().toLowerCase() === "production";
    const maxAgeAccess = parseExpiry(process.env.JWT_ACCESS_SECRET_EXPIRY, 15 * 60 * 1000);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: maxAgeAccess,
    });

    res.status(200).json({
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  const isProd = process.env.NODE_ENV?.trim().toLowerCase() === "production";

  const clearCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    expires: new Date(0),
  };

  res.cookie("accessToken", "", clearCookieOptions);
  res.cookie("refreshToken", "", clearCookieOptions);

  res.status(200).json({ message: "User logged out successfully." });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    role: user.role,
    planTier: user.planTier || "normal",
  });
});

export { authLogin, refreshAccessToken, logoutUser, getMe };
