import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import HabitGuide, { HABIT_CODE_LIST } from "../model/habitGuide.model.js";
import HabitLog from "../model/habitLog.model.js";
import User from "../model/user.model.js";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate zone and day from programStartDate.
 * Each zone = 21 days (3 weeks × 7 days).
 */
function calculateProgramStatus(programStartDate) {
  if (!programStartDate) {
    return { currentZone: 1, currentDay: 1, totalDaysInZone: 21 };
  }

  const start = startOfDay(new Date(programStartDate));
  const today = startOfDay(new Date());
  
  // Calculate difference in days
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { currentZone: 1, currentDay: 1, totalDaysInZone: 21, started: false };
  }

  const DAYS_PER_ZONE = 21;
  const totalZones = 5;

  const zone = Math.min(Math.floor(diffDays / DAYS_PER_ZONE) + 1, totalZones);
  const dayInZone = (diffDays % DAYS_PER_ZONE) + 1;
  const clampedDay = Math.min(dayInZone, DAYS_PER_ZONE);

  return {
    currentZone: zone,
    currentDay: clampedDay,
    totalDaysInZone: DAYS_PER_ZONE,
    started: true
  };
}

// ─── PATIENT CONTROLLERS ────────────────────────────────────────────────────

/**
 * GET /api/v1/patients/program-status
 */
export const getProgramStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("programStartDate");
  if (!user) throw new ApiError(404, "User not found");

  const status = calculateProgramStatus(user.programStartDate);
  return res.status(200).json(new ApiResponse(200, status, "Program status fetched"));
});

/**
 * GET /api/v1/patients/habits/today
 */
export const getTodayHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const todayStart = startOfDay(new Date());

  const log = await HabitLog.findOne({ patientId, date: todayStart });

  const habits = HABIT_CODE_LIST.map((code) => ({
    habitCode: code,
    completed: log ? log.completedHabits.includes(code) : false,
  }));

  return res.status(200).json(new ApiResponse(200, { habits, submitted: !!log }, "Today's habits fetched"));
});

/**
 * POST /api/v1/patients/habits/submit
 * Body: { completedHabits: ["Hydration", "Exercise", ...] }
 */
export const submitHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { completedHabits } = req.body;

  if (!Array.isArray(completedHabits)) {
    throw new ApiError(400, "completedHabits must be an array");
  }

  // Validate habit codes
  const validHabits = completedHabits.filter(h => HABIT_CODE_LIST.includes(h));

  const user = await User.findById(patientId).select("programStartDate");
  const { currentZone, currentDay } = calculateProgramStatus(user.programStartDate);

  const todayStart = startOfDay(new Date());

  // Prevent duplicate submissions for the same calendar date
  const existing = await HabitLog.findOne({ patientId, date: todayStart });
  if (existing) {
    throw new ApiError(400, "You have already submitted your habits for today.");
  }

  const log = await HabitLog.create({
    patientId,
    zone: currentZone,
    day: currentDay,
    date: todayStart,
    completedHabits: validHabits,
    notes,
    mood
  });

  return res.status(200).json(new ApiResponse(200, { log }, "Habits submitted successfully"));
});

/**
 * GET /api/v1/patients/habits/history
 */
export const getHabitHistory = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const logs = await HabitLog.find({ patientId }).sort({ date: -1 });
  return res.status(200).json(new ApiResponse(200, { logs }, "Habit history fetched"));
});

/**
 * GET /api/v1/patients/habits/:habitCode/guide
 */
export const getHabitGuide = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { habitCode } = req.params;

  if (!HABIT_CODE_LIST.includes(habitCode)) {
    throw new ApiError(400, "Invalid habitCode");
  }

  const user = await User.findById(patientId).select("programStartDate");
  const { currentZone } = calculateProgramStatus(user?.programStartDate);

  // Focus on zone-level default as per new requirements
  // (We still support patient-specific if it exists, but the logic is primarily zone-based)
  let guide = await HabitGuide.findOne({ habitCode, zone: currentZone, patientId: null });

  // If no default, try patient-specific (backwards compat)
  if (!guide) {
    guide = await HabitGuide.findOne({ habitCode, zone: currentZone, patientId });
  }

  if (!guide) {
    return res.status(200).json(new ApiResponse(200, { guide: null, message: "Your guide will be available soon." }, "No guide content yet"));
  }

  return res.status(200).json(new ApiResponse(200, { guide, zone: currentZone }, "Habit guide fetched"));
});

// ─── DOCTOR CONTROLLERS ─────────────────────────────────────────────────────

/**
 * POST /api/v1/doctor/habit-guide
 * Upsert guide for { zone, habitCode }
 */
export const assignHabitGuide = asyncHandler(async (req, res) => {
  const { habitCode, zone, content } = req.body;

  if (!habitCode || !HABIT_CODE_LIST.includes(habitCode)) {
    throw new ApiError(400, "Invalid or missing habitCode");
  }
  if (!zone || zone < 1 || zone > 5) {
    throw new ApiError(400, "Zone must be between 1 and 5");
  }
  if (!content || !content.trim()) {
    throw new ApiError(400, "Guide content is required");
  }

  const filter = {
    habitCode,
    zone: Number(zone),
    patientId: null, // Global for that zone
  };

  const guide = await HabitGuide.findOneAndUpdate(
    filter,
    { ...filter, content: content.trim() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(new ApiResponse(200, { guide }, "Habit guide assigned successfully"));
});

/**
 * GET /api/v1/doctor/habit-guide
 */
export const getHabitGuides = asyncHandler(async (req, res) => {
  const guides = await HabitGuide.find({ patientId: null })
    .sort({ zone: 1, habitCode: 1 });

  return res.status(200).json(new ApiResponse(200, { guides }, "Habit guides fetched"));
});

/**
 * PATCH /api/v1/doctor/habit-guide/:id
 */
export const updateHabitGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const guide = await HabitGuide.findByIdAndUpdate(
    id,
    { content: content.trim() },
    { new: true }
  );

  if (!guide) throw new ApiError(404, "Guide not found");

  return res.status(200).json(new ApiResponse(200, { guide }, "Habit guide updated"));
});

/**
 * DELETE /api/v1/doctor/habit-guide/:id
 */
export const deleteHabitGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const guide = await HabitGuide.findByIdAndDelete(id);
  if (!guide) throw new ApiError(404, "Guide not found");
  return res.status(200).json(new ApiResponse(200, {}, "Habit guide deleted"));
});
